import { Injectable } from '@angular/core';

import {Shift} from '../_domain/Shift/Shift';
import {ClassType} from '../_domain/ClassType/ClassType';
import {Lesson} from '../_domain/Lesson/Lesson';
import {Course} from '../_domain/Course/Course';

@Injectable({
  providedIn: 'root'
})
export class TestingService {

  // Course defaults
  private COURSE_ID = 123456789;
  private COURSE_NAME = 'Course Name';
  private COURSE_ACRONYM = 'CN01';
  private COURSE_SEMESTER = 1;

  // Shift defaults
  private SHIFT_NAME = 'SN01';
  private SHIFT_TYPE = ClassType.THEORY_PT;
  private SHIFT_CAMPUS = 'Alameda';

  // Lesson defaults
  private LESSON_ROOM = 'R1';
  private LESSON_CAMPUS = this.SHIFT_CAMPUS;

  constructor() { }

  /* --------------------------------------------------------------------------------
   * Creates a Shift focusing only on time it occurs.
   * --------------------------------------------------------------------------------
   * [Params' format]
   *  - weekday: mon | tue | wed | thu | fri | sat | sun
   *  - start: HH:mm
   *  - end: HH:mm
   * -------------------------------------------------------------------------------- */
  createTimeOnlyShift(times: {weekday: string, start: string, end: string}[]): Shift {
    const lessons: Lesson[] = [];
    times.forEach(time => {
      lessons.push(this.createTimeOnlyLesson(time.weekday, time.start, time.end));
    });
    return new Shift(this.SHIFT_NAME, this.SHIFT_TYPE, lessons, this.SHIFT_CAMPUS);
  }

  /* --------------------------------------------------------------------------------
   * Creates a Lesson focusing only on time it occurs.
   * --------------------------------------------------------------------------------
   * [Params' format]
   *  - weekday: mon | tue | wed | thu | fri | sat | sun
   *  - start: HH:mm
   *  - end: HH:mm
   * -------------------------------------------------------------------------------- */
  createTimeOnlyLesson(weekday: string, start: string, end: string): Lesson {
    let s: Date;
    let e: Date;

    switch (weekday) {
      case 'mon':
        s = new Date('2020-09-21 ' + start);
        e = new Date('2020-09-21 ' + end);
        break;

      case 'tue':
        s = new Date('2020-09-22 ' + start);
        e = new Date('2020-09-22 ' + end);
        break;

      case 'wed':
        s = new Date('2020-09-23 ' + start);
        e = new Date('2020-09-23 ' + end);
        break;

      case 'thu':
        s = new Date('2020-09-24 ' + start);
        e = new Date('2020-09-24 ' + end);
        break;

      case 'fri':
        s = new Date('2020-09-25 ' + start);
        e = new Date('2020-09-25 ' + end);
        break;

      case 'sat':
        s = new Date('2020-09-26 ' + start);
        e = new Date('2020-09-26 ' + end);
        break;

      case 'sun':
        s = new Date('2020-09-27 ' + start);
        e = new Date('2020-09-27 ' + end);
        break;
    }

    return new Lesson(s, e, this.LESSON_ROOM, this.LESSON_CAMPUS);
  }
}
