import { Injectable } from '@angular/core';

import {LoggerService} from '../_util/logger.service';

import {Schedule} from '../_domain/Schedule';
import {Class} from '../_domain/Class';
import {Course} from '../_domain/Course';
import {Shift} from '../_domain/Shift';

@Injectable({
  providedIn: 'root'
})
export class SchedulesGenerationService {

  constructor(private logger: LoggerService) { }

  /* --------------------------------------------------------------------------------
   * Returns generated schedules based on user selected courses.
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - get all combinations of shifts for a given course (taking into account hours
   *    per week of each type of class selected); check for overlaps and discard
   *  - combine each to create different schedules; check for overlaps and discard
   * -------------------------------------------------------------------------------- */
  generateSchedules(courses: Course[]): Schedule[] {
    this.logger.log('generating...');

    // Combine shifts
    const classesPerCourse: Class[][] = [];
    for (const course of courses) {
      const classes = this.combineShifts(course);
      classesPerCourse.push(classes);
    }

    // Combine classes
    const schedules: Schedule[] = this.combineClasses(classesPerCourse);

    this.logger.log('done');
    return schedules;
  }

  combineShifts(course: Course): Class[] {
    const shiftsMap = new Map<string, Shift[]>();
    const shiftsArray: Shift[][] = [];

    // Group shifts based on type of class
    for (const shift of course.shifts) {
      shiftsMap.has(shift.type) ? shiftsMap.get(shift.type).push(shift) : shiftsMap.set(shift.type, [shift]);
    }

    // Get input ready for combination
    for (const key of shiftsMap.keys()) {
      shiftsArray.push(shiftsMap.get(key));
    }

    // Get combinations of shifts & arrange into classes
    const classes: Class[] = [];
    for (const combination of this.allPossibleCases(shiftsArray)) {
      // Check for overlaps and discard
      if (this.checkForOverlapsOnShifts(combination)) { continue; }
      classes.push(new Class(course, combination));
    }

    return classes;
  }

  combineClasses(classes: Class[][]): Schedule[] {
    let id = 0;
    // Get combinations of classes & arrange into schedules
    const schedules: Schedule[] = [];
    for (const combination of this.allPossibleCases(classes)) {
      // Check for overlaps and discard
      if (this.checkForOverlapsOnClasses(combination)) { continue; }
      schedules.push(new Schedule(id++, combination));
    }
    return schedules;
  }

  /* --------------------------------------------------------------------------------
   * Returns all possible combinations between different arrays.
   * --------------------------------------------------------------------------------
   * For example:
   * array = [ ['a', 'b'], ['c'], ['d', 'e', 'f'] ]
   *
   * result = [ ['a', 'c', 'd'], ['b', 'c', 'd'], ['a', 'c', 'e'], ['b', 'c', 'e'],
   *          ['a', 'c', 'f'], ['b', 'c', 'f'] ]
   * --------------------------------------------------------------------------------
   * [Reference]
   * https://stackoverflow.com/questions/4331092/finding-all-combinations-cartesian-
   * product-of-javascript-array-values
   * -------------------------------------------------------------------------------- */
  allPossibleCases(array: any[][]): any[][] {
    // Clean array: if any is [] remove
    for (let i = array.length - 1; i >= 0; i--) {
      const arrayToCheck = array[i];
      if (arrayToCheck.length === 0) {
        array.splice(i, 1);
      }
    }

    // Nothing to combine
    if (array.length === 0) { return []; }

    return allPossibleCasesHelper(array, true);

    function allPossibleCasesHelper(arr: any[][], isFirst: boolean): any[][] {
      if (arr.length === 1) {
        if (isFirst) {
          // Make an array of every item, if nothing to combine
          for (let i = 0; i < arr[0].length; i++) {
            arr[0][i] = [arr[0][i]];
          }
        }
        return arr[0];

      } else {
        const result = [];
        const allCasesOfRest = allPossibleCasesHelper(arr.slice(1), false);
        for (let rest of allCasesOfRest) {
          for (let item of arr[0]) {
            if (!Array.isArray(item)) { item = [item]; }
            if (!Array.isArray(rest)) { rest = [rest]; }
            result.push(item.concat(rest));
          }
        }
        return result;
      }
    }
  }

  checkForOverlapsOnShifts(shifts: Shift[]): boolean {
    for (let i = 0; i < shifts.length - 1; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        if (shifts[i].overlap(shifts[j])) { return true; }
      }
    }
    return false;
  }

  checkForOverlapsOnClasses(classes: Class[]): boolean {
    for (let i = 0; i < classes.length - 1; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        if (classes[i].overlap(classes[j])) { return true; }
      }
    }
    return false;
  }
}
