// tslint:disable:max-line-length
import { EventEmitter, Injectable } from '@angular/core';

import {LoggerService} from '../../_util/logger.service';
import {StateService} from '../state/state.service';

import {Schedule} from '../../_domain/Schedule/Schedule';
import {Class} from '../../_domain/Class/Class';
import {Course} from '../../_domain/Course/Course';
import {Shift} from '../../_domain/Shift/Shift';
import {Lesson} from '../../_domain/Lesson/Lesson';
import {Event} from '../../_domain/Event/Event';

import {formatTime, getTimestamp, getWeekday} from '../../_util/Time';
import {minifyClassType} from '../../_domain/ClassType/ClassType';

@Injectable({
  providedIn: 'root'
})
export class SchedulesGenerationService {

  generatedSchedulesInfo: Map<number, { // scheduleID -> info
    proximity: number,
    nr_holes: number,
    total_duration: number,
    total_deviation: number,
    nr_free_days: number,
    events: Event[]
  }> = new Map<number, {proximity: number, nr_holes: number, total_duration: number, total_deviation: number, nr_free_days: number, events: Event[]}>();

  constructor(public logger: LoggerService, private stateService: StateService) { }

  /* --------------------------------------------------------------------------------
   * Returns generated schedules based on user selected courses.
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - get all combinations of shifts for a given course (taking into account hours
   *    per week of each type of class selected); check for overlaps and discard
   *  - combine each to create different schedules; check for overlaps and discard
   *  - calculate relevant info for all types of sorting for all schedules
   *  - sort by most compact (default)
   * -------------------------------------------------------------------------------- */
   async generateSchedules(courses: Course[]): Promise<Schedule[]> {
    this.logger.log('generating...');

    // Combine shifts
    this.logger.log('combining shifts...');
    const classesPerCourse: Class[][] = [];
    for (const course of courses) {
      const classes = this.combineShifts(course);
      classesPerCourse.push(classes);
    }

    // Combine classes
    this.logger.log('combining classes...');
    let schedules: Schedule[] = await this.combineClasses(classesPerCourse);

    // Calculate relevant info
    this.logger.log('calculating info...');
    this.calculateSchedulesInfo(schedules);

    // Sort by most compact
    this.logger.log('sorting...');
    schedules = this.sortByMostCompact(schedules);

    // Clean previous states
    this.stateService.schedulesSortedByMostBalanced = null;
    this.stateService.schedulesSortedByMostFreeDays = null;

    this.logger.log('done');
    return schedules;
  }

  /* --------------------------------------------------------------------------------
   * Sorts schedules by most compact
   * --------------------------------------------------------------------------------
   * [Heuristic Preference Order]
   *  - less #holes
   *  - smaller sum of total duration + proximity level
   *  - more balanced
   *  - more free days
   * -------------------------------------------------------------------------------- */
  sortByMostCompact(schedules: Schedule[]): Schedule[] {
    schedules.sort((a, b) => {
      const aInfo = this.generatedSchedulesInfo.get(a.id);
      const bInfo = this.generatedSchedulesInfo.get(b.id);
      const compactSumA = aInfo.total_duration + aInfo.proximity;
      const compactSumB = bInfo.total_duration + bInfo.proximity;

      if (aInfo.nr_holes === bInfo.nr_holes) {
        if (compactSumA === compactSumB)
          return aInfo.total_deviation === bInfo.total_deviation ?
            bInfo.nr_free_days - aInfo.nr_free_days : aInfo.total_deviation - bInfo.total_deviation;
        return compactSumA - compactSumB;
      }
      return aInfo.nr_holes - bInfo.nr_holes;
    });

    // Save state
    this.stateService.schedulesSortedByMostCompact = [...schedules];

    this.logger.log('Sorted by most compact', schedules);
    return [...schedules];
  }

  /* --------------------------------------------------------------------------------
   * Sorts schedules by most balanced
   * --------------------------------------------------------------------------------
   * [Heuristic]
   *  - more balanced
   *  - more compact
   *  - more free days
   * -------------------------------------------------------------------------------- */
  sortByMostBalanced(schedules: Schedule[]): Schedule[] {
    schedules.sort((a, b) => {
      const aInfo = this.generatedSchedulesInfo.get(a.id);
      const bInfo = this.generatedSchedulesInfo.get(b.id);
      const compactSumA = aInfo.total_duration + aInfo.proximity;
      const compactSumB = bInfo.total_duration + bInfo.proximity;

      if (aInfo.total_deviation === bInfo.total_deviation) {
        if (aInfo.nr_holes === bInfo.nr_holes)
          return compactSumA === compactSumB ? bInfo.nr_free_days - aInfo.nr_free_days : compactSumA - compactSumB;
        return aInfo.nr_holes - bInfo.nr_holes;
      }
      return aInfo.total_deviation - bInfo.total_deviation;
    });

    // Save state
    this.stateService.schedulesSortedByMostBalanced = [...schedules];

    this.logger.log('Sorted by most balanced', schedules);
    return [...schedules];
  }

  /* --------------------------------------------------------------------------------
   * Sorts schedules by most free days
   * --------------------------------------------------------------------------------
   * [Heuristic]
   *  - more free days
   *  - more compact
   *  - more balanced
   * -------------------------------------------------------------------------------- */
  sortByMostFreeDays(schedules: Schedule[]): Schedule[] {
    schedules.sort((a, b) => {
      const aInfo = this.generatedSchedulesInfo.get(a.id);
      const bInfo = this.generatedSchedulesInfo.get(b.id);
      const compactSumA = aInfo.total_duration + aInfo.proximity;
      const compactSumB = bInfo.total_duration + bInfo.proximity;

      if (aInfo.nr_free_days === bInfo.nr_free_days) {
        if (aInfo.nr_holes === bInfo.nr_holes)
          return compactSumA === compactSumB ?
            aInfo.total_deviation - bInfo.total_deviation : compactSumA - compactSumB;
        return aInfo.nr_holes - bInfo.nr_holes;
      }
      return bInfo.nr_free_days - aInfo.nr_free_days;
    });

    // Save state
    this.stateService.schedulesSortedByMostFreeDays = [...schedules];

    this.logger.log('Sorted by most free days', schedules);
    return [...schedules];
  }

  combineShifts(course: Course): Class[] {
    const shiftsMap = new Map<string, Shift[]>();

    // Group shifts based on type of class
    for (const shift of course.shifts)
      shiftsMap.has(shift.type) ? shiftsMap.get(shift.type).push(shift) : shiftsMap.set(shift.type, [shift]);

    // Get combinations of shifts
    let combinations: Shift[][] = [];
    for (const [key, value] of shiftsMap) {
      const shifts = value;
      const allCases = this.allPossibleCases([combinations, shifts]);
      combinations = [];
      for (const combination of allCases) {
        // Check for overlaps and discard
        if (this.checkForOverlapsOnShifts(combination)) continue;
        combinations.push(combination);
      }
      if (combinations.length === 0) break;
    }

    // Arrange into classes
    const classes: Class[] = [];
    for (const combination of combinations)
      classes.push(new Class(course, combination));
    return classes;
  }

  async combineClasses(classes: Class[][]): Promise<Schedule[]> {
    const optimalNumberWorkers = window.navigator.hardwareConcurrency;
    const browserSupportsWebWorkers = this.getBrowserSupportForWorkers();

    // Create workers
    const workers: Worker[] = [];
    if (browserSupportsWebWorkers) {
      for (let i = 0; i < optimalNumberWorkers; i++) {
        const worker = new Worker('../../_workers/generation-worker.worker', { type: 'module' });
        workers.push(worker);
      }
    }

    // Sort classes by least
    classes.sort(((a, b) => a.length - b.length));

    // Get combinations of classes
    let combinations: Class[][] = [];
    for (const cls of classes) {

      if (!browserSupportsWebWorkers) {
        const allCases = this.allPossibleCases([combinations, cls]);
        combinations = [];
        for (const combination of allCases) {
          // Check for overlaps and discard
          if (this.checkForOverlapsOnClasses(combination)) continue;
          combinations.push(combination);
        }

      } else {
        const numberClasses = cls.length;
        const classesPerWorker = Math.floor(numberClasses / optimalNumberWorkers);
        let mod = numberClasses % optimalNumberWorkers;
        let tempCombinations = [];

        let workersUsed = 0;
        const allWorkersFinished = new EventEmitter<void>();
        const allFinished = new Promise((resolve) => allWorkersFinished.subscribe(() => resolve()));

        let i = 0;
        let workerIndex = 0;
        while (i < numberClasses) {
          workers[workerIndex].onmessage = ({ data }) => {
            tempCombinations = tempCombinations.concat(this.parseData(data));
            workersUsed--;
            if (workersUsed === 0) allWorkersFinished.emit();
          };

          if (mod > 0) {
            workers[workerIndex].postMessage({worker: workerIndex + 1, combinations, classes: cls.slice(i, i + classesPerWorker + 1)});
            mod--;
            i = i + classesPerWorker + 1;

          } else {
            workers[workerIndex].postMessage({worker: workerIndex + 1, combinations, classes: cls.slice(i, i + classesPerWorker)});
            i = i + classesPerWorker;
          }
          workersUsed++;
          workerIndex++;
        }

        await allFinished;
        combinations = [...tempCombinations];
        this.logger.log('all combinations with course ' + cls[0].course.formatAcronym() + ' finished', combinations);
      }
      if (combinations.length === 0) return [];
    }

    // Terminate workers
    for (const worker of workers)
      worker.terminate();

    // Arrange into schedules
    let id = 0;
    const schedules: Schedule[] = [];
    for (const combination of combinations)
      schedules.push(new Schedule(id++, combination));
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
    for (let i = array.length - 1; i >= 0; i--)
      if (array[i].length === 0) array.splice(i, 1);

    // Nothing to combine
    if (array.length === 0) return [];

    return allPossibleCasesHelper(array, true);

    function allPossibleCasesHelper(arr: any[][], isFirst: boolean): any[][] {
      if (arr.length === 1) {
        if (isFirst)
          // Make an array of every item, if nothing to combine
          for (let i = 0; i < arr[0].length; i++)
            arr[0][i] = [arr[0][i]];
        return arr[0];

      } else {
        const result = [];
        const allCasesOfRest = allPossibleCasesHelper(arr.slice(1), false);
        for (let rest of allCasesOfRest) {
          for (let item of arr[0]) {
            if (!Array.isArray(item)) item = [item];
            if (!Array.isArray(rest)) rest = [rest];
            result.push(item.concat(rest));
          }
        }
        return result;
      }
    }
  }

  checkForOverlapsOnShifts(shifts: Shift[]): boolean {
    for (let i = 0; i < shifts.length - 1; i++)
      for (let j = i + 1; j < shifts.length; j++)
        if (shifts[i].overlap(shifts[j])) return true;
    return false;
  }

  checkForOverlapsOnClasses(classes: Class[]): boolean {
    for (let i = 0; i < classes.length - 1; i++)
      for (let j = i + 1; j < classes.length; j++)
        if (classes[i].overlap(classes[j])) return true;
    return false;
  }

  calculateSchedulesInfo(schedules: Schedule[]): void {
    for (const schedule of schedules) {
      // Get info
      const data = this.prepareData(1, schedule.classes);
      const allLessons: Lesson[] = data.allLessons;
      const classesPerWeekday: Map<number, {start: number, end: number}[]> = data.classesPerWeekday;
      const events: Event[] = data.events;

      const proximity = this.calculateProximityLevel(schedule, allLessons);
      const holesInfo = this.countHoles(classesPerWeekday);
      const deviation = this.calculateDeviation(classesPerWeekday);
      const freeDays = this.calculateNumberFreeDays(classesPerWeekday);

      this.generatedSchedulesInfo.set(schedule.id, {
        proximity,
        nr_holes: holesInfo.nr_holes,
        total_duration: holesInfo.total_duration,
        total_deviation: deviation,
        nr_free_days: freeDays,
        events
      });
    }
  }

  prepareData(tag: number, classes: Class[]): { allLessons: Lesson[], classesPerWeekday: Map<number, {start: number, end: number}[]>, events: Event[] } {
    const allLessons: Lesson[] = [];
    const classesPerWeekday = new Map<number, {start: number, end: number}[]>();
    const events: Event[] = [];

    for (const cl of classes) {
      const acronym = cl.course.acronym;

      for (const shift of cl.shifts) {
        const type = minifyClassType(shift.type);
        const pinned = false;

        for (const lesson of shift.lessons) {
          // Get all lessons
          allLessons.push(lesson);

          // Get classes per weekday
          const key = lesson.start.getDay();
          const value = { start: getTimestamp(formatTime(lesson.start)), end: getTimestamp(formatTime(lesson.end)) };
          classesPerWeekday.has(key) ? classesPerWeekday.get(key).push(value) : classesPerWeekday.set(key, [value]);

          // Get events
          const weekday = getWeekday(lesson.start.getDay());
          const start = formatTime(lesson.start);
          const end = formatTime(lesson.end);
          const name = acronym.replace(/[0-9]/g, '') + ' (' + type + ')';
          const place = lesson.room;
          events.push(new Event(shift.name, tag, weekday, start, end, name, place, pinned));
        }
      }
      tag++;
    }

    // Sort classes per weekday by start time
    for (let i = 1; i <= 5; i++)
      if (classesPerWeekday.has(i) && classesPerWeekday.get(i).length > 1)
        classesPerWeekday.get(i).sort((a, b) => a.start - b.start);

    return {allLessons, classesPerWeekday, events};
  }

  countHoles(classesPerWeekday: Map<number, {start: number, end: number}[]>): {nr_holes: number, total_duration: number} {
    let numberOfHoles = 0;
    let totalDuration = 0;

    for (let i = 1; i <= 5; i++) {
      if (classesPerWeekday.has(i) && classesPerWeekday.get(i).length > 1) {
        const classes = classesPerWeekday.get(i);

        for (let j = 0; j < classes.length - 1; j++) {
          const current = classes[j];
          const next = classes[j + 1];

          if (next.start > current.end) { // there's a hole
            numberOfHoles++;
            totalDuration += next.start - current.end;
          }
        }
      }
    }
    return {nr_holes: numberOfHoles, total_duration: totalDuration};
  }

  calculateProximityLevel(schedule: Schedule, allLessons: Lesson[]): number {
    let proximity = 0;

    for (let i = 0; i < allLessons.length - 1; i++) {
      const lesson1Start = getTimestamp(formatTime(allLessons[i].start));
      const lesson1Day = allLessons[i].start.getDay();

      for (let j = i + 1; j < allLessons.length; j++) {
        const lesson2Start = getTimestamp(formatTime(allLessons[j].start));
        const lesson2Day = allLessons[j].start.getDay();
        proximity += Math.abs(lesson1Start - lesson2Start) + Math.abs(lesson1Day - lesson2Day);
      }
    }
    return proximity;
  }

  calculateDeviation(classesPerWeekday: Map<number, {start: number, end: number}[]>): number {
    const hoursPerWeekDay: Map<number, number> = new Map();
    let totalHoursPerWeek = 0;

    // Get hours per weekday
    classesPerWeekday.forEach((value, key) => {
      let total = 0;
      value.forEach(classTimes => {
        total += classTimes.end - classTimes.start;
      });
      hoursPerWeekDay.set(key, total);
      totalHoursPerWeek += total;
    });

    // Calculate Balanced Index
    const balancedIndex = totalHoursPerWeek / 5;

    // Calculate deviation from Balanced Index
    let deviation = 0;
    hoursPerWeekDay.forEach(value => {
      deviation += Math.abs(balancedIndex - value);
    });
    return deviation;
  }

  calculateNumberFreeDays(classesPerWeekday: Map<number, {start: number, end: number}[]>): number {
    let freeDays = 0;
    for (let i = 1; i <= 5; i++)
      if (!classesPerWeekday.has(i) || classesPerWeekday.get(i).length === 0) freeDays++;
    return freeDays;
  }

  parseData(data): Class[][] {
    const final: Class[][] = [];
    for (const item of data) {
      const classes: Class[] = [];
      for (const subItem of item) {
        const course = getCourse(subItem._course._name, this.stateService.selectedCourses);
        const shifts = getShifts(subItem._shifts);
        classes.push(new Class(course, shifts));
      }
      final.push(classes);
    }
    return final;

    function getCourse(name: string, courses: Course[]): Course {
      for (const course of courses)
        if (course.name === name) return course;
      return null;
    }

    function getShifts(shs): Shift[] {
      const shifts: Shift[] = [];
      for (const shift of shs) {
        const lessons: Lesson[] = [];
        for (const lesson of shift._lessons)
          lessons.push(new Lesson(new Date(lesson._start), new Date(lesson._end), lesson._room, lesson._campus));
        shifts.push(new Shift(shift._name, shift._type, lessons, shift._campus));
      }
      return shifts;
    }
  }

  getBrowserSupportForWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }
}
