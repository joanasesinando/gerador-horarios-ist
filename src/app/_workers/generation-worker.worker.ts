/// <reference lib="webworker" />

import {Class} from '../_domain/Class/Class';
import {Course} from '../_domain/Course/Course';
import {Shift} from '../_domain/Shift/Shift';
import {Lesson} from '../_domain/Lesson/Lesson';
import {Degree} from '../_domain/Degree/Degree';
import {ClassType} from '../_domain/ClassType/ClassType';
import {formatTime, getTimestamp} from '../_util/Time';

addEventListener('message', ({ data }) => {
  console.log('Worker #' + data.worker + ' working...');

  let combinations = data.combinations;
  const classes = data.classes;
  const allCases = allPossibleCases([combinations, classes]);

  combinations = [];
  for (const combination of allCases) {
    // Check for overlaps and discard
    if (checkForOverlapsOnClasses(combination)) continue;
    combinations.push(combination);
  }
  postMessage(combinations);

  console.log('Worker #' + data.worker + ' finished!');
});

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
function allPossibleCases(array: any[][]): any[][] {
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

function checkForOverlapsOnClasses(classes: Class[]): boolean {
  for (let i = 0; i < classes.length - 1; i++)
    for (let j = i + 1; j < classes.length; j++)
      if (overlapClass(classes[i], classes[j])) return true;
  return false;

  function overlapClass(class1, class2): boolean {
    for (const shift of class1._shifts)
      for (const otherShift of class2._shifts)
        if (overlapShift(shift, otherShift)) return true;
    return false;
  }

  function overlapShift(shift1, shift2): boolean {
    for (const lesson of shift1._lessons)
      for (const otherLesson of shift2._lessons)
        if (overlapLesson(lesson, otherLesson)) return true;
    return false;
  }
}

function overlapLesson(lesson1, lesson2): boolean {
  lesson1.start = new Date(lesson1._start);
  lesson1.end = new Date(lesson1._end);
  lesson2.start = new Date(lesson2._start);
  lesson2.end = new Date(lesson2._end);

  const weekDay = lesson1.start.getDay();
  const startTime = getTimestamp(formatTime(lesson1.start));
  const endTime = getTimestamp(formatTime(lesson1.end));

  const otherWeekDay = lesson2.start.getDay();
  const otherStartTime = getTimestamp(formatTime(lesson2.start));
  const otherEndTime = getTimestamp(formatTime(lesson2.end));

  return weekDay === otherWeekDay && (
    (startTime >= otherStartTime && startTime < otherEndTime) ||
    (otherStartTime >= startTime && otherStartTime < endTime) ||
    (endTime > otherStartTime && endTime <= otherEndTime) ||
    (otherEndTime > startTime && otherEndTime <= endTime)
  );
}

function parseCombinations(data): Class[][] {
  const final: Class[][] = [];
  for (const item of data) {
    const classes: Class[] = [];
    for (const subItem of item) {
      const course = getCourse(subItem._course);
      const shifts = getShifts(subItem._shifts);
      classes.push(new Class(course, shifts));
    }
    final.push(classes);
  }
  return final;
}

function parseClasses(data): Class[] {
  const classes: Class[] = [];
  for (const item of data) {
    const course = getCourse(item._course);
    const shifts = getShifts(item._shifts);
    classes.push(new Class(course, shifts));
  }
  return classes;
}

function getCourse(course): Course {
  const shifts = getShifts(course._shifts);

  const types: ClassType[] = [];
  for (const type of course._types)
    types.push(type);

  const campus: string[] = [];
  for (const camp of course._campus)
    campus.push(camp);
  return new Course(course._id, course._name, course._acronym, course._credits, course._semester, course._period, types, campus, shifts,
    course._courseLoads, new Degree(course._degree._id, course._degree._name, course._degree._acronym));
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
