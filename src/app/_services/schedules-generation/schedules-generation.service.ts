import { Injectable } from '@angular/core';

import {LoggerService} from '../../_util/logger.service';

import {Schedule} from '../../_domain/Schedule';
import {Class} from '../../_domain/Class';
import {Course} from '../../_domain/Course';
import {Shift} from '../../_domain/Shift';
import {Lesson} from '../../_domain/Lesson';
import {formatTime, getTimestamp} from '../../_util/Time';

@Injectable({
  providedIn: 'root'
})
export class SchedulesGenerationService {

  constructor(public logger: LoggerService) { }

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
    let schedules: Schedule[] = this.combineClasses(classesPerCourse);

    // Sort by most compact
    schedules = this.sortByMostCompact(schedules);

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

  /* --------------------------------------------------------------------------------
   * Sorts schedules by most compact, i.e. with less holes between classes
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - Get number of holes and total duration of holes per week for each schedule
   *  - sort by least number of holes; if same number of holes, sort by least
   *    total duration of holes
   * -------------------------------------------------------------------------------- */
  sortByMostCompact(schedules: Schedule[]): Schedule[] {
    const schedulesInfo: {index: number, proximity: number, nr_holes: number, total_duration: number}[] = [];

    // Get #holes & total_duration of holes
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const allLessons = this.getAllLessons(schedule);
      const proximity = this.calculateProximityLevel(allLessons);
      const classesPerWeekday: Map<number, {start: number, end: number}[]> = this.getClassesPerWeekday(schedule);
      const holesInfo = this.getScheduleHolesInfo(classesPerWeekday, i);
      schedulesInfo.push({index: holesInfo.index, proximity, nr_holes: holesInfo.nr_holes, total_duration: holesInfo.total_duration});
    }

    // Sort
    schedulesInfo.sort((a, b) => {
      if (a.nr_holes === b.nr_holes) {
        return a.proximity === b.proximity ? a.total_duration - b.total_duration : a.proximity - b.proximity;
      }
      return a.nr_holes - b.nr_holes;
    });

    const sortedSchedules: Schedule[] = [];
    let id = 0;
    schedulesInfo.forEach(info => {
      schedules[info.index].id = id++;
      sortedSchedules.push(schedules[info.index]);
    });
    return sortedSchedules;
  }

  getScheduleHolesInfo(classesPerWeekday: Map<number, {start: number, end: number}[]>, index: number):
    {index: number, nr_holes: number, total_duration: number} {

    let numberOfHoles = 0;
    let totalDuration = 0;
    for (let i = 1; i <= 7; i++) {
      if (classesPerWeekday.has(i) && classesPerWeekday.get(i).length > 1) {
        const weekday = classesPerWeekday.get(i);

        for (let j = 0; j < weekday.length - 1; j++) {
          const current = weekday[j];
          const next = weekday[j + 1];

          if (next.start > current.end) { // there's a hole
            numberOfHoles++;
            totalDuration += next.start - current.end;
          }
        }
      }
    }
    return {index, nr_holes: numberOfHoles, total_duration: totalDuration};
  }

  getClassesPerWeekday(schedule: Schedule): Map<number, {start: number, end: number}[]> {
    const resMap = new Map<number, {start: number, end: number}[]>();
    schedule.classes.forEach(cl => {
      cl.shifts.forEach(shift => {
        shift.lessons.forEach(lesson => {
          const key = lesson.start.getDay();
          const value = {start: getTimestamp(formatTime(lesson.start)), end: getTimestamp(formatTime(lesson.end))};
          resMap.has(key) ? resMap.get(key).push(value) : resMap.set(key, [value]);
        });
      });
    });

    for (let i = 1; i <= 7; i++) {
      if (resMap.has(i) && resMap.get(i).length > 1) {
        resMap.get(i).sort((a, b) => a.start - b.start);
      }
    }
    return resMap;
  }

  calculateProximityLevel(lessons: Lesson[]): number {
    let proximity = 0;
    for (let i = 0; i < lessons.length - 1; i++) {
      const lesson1Start = getTimestamp(formatTime(lessons[i].start));
      const lesson1Day = lessons[i].start.getDay();

      for (let j = i + 1; j < lessons.length; j++) {
        const lesson2Start = getTimestamp(formatTime(lessons[j].start));
        const lesson2Day = lessons[j].start.getDay();
        proximity += Math.abs(lesson1Start - lesson2Start) + Math.abs(lesson1Day - lesson2Day);
      }
    }
    return proximity;
  }

  getAllLessons(schedule: Schedule): Lesson[] {
    const lessons: Lesson[] = [];
    schedule.classes.forEach(cl => {
      cl.shifts.forEach(shift => {
        shift.lessons.forEach(lesson => {
          lessons.push(lesson);
        });
      });
    });
    return lessons;
  }
}
