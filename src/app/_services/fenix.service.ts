import { Injectable } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {Course, Type, Shift, Lesson} from '../_domain/Course';
import {Degree} from '../_domain/Degree';


@Injectable({
  providedIn: 'root'
})
export class FenixService {

  // FIXME: take server out
  url = 'https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/';

  constructor(public translateService: TranslateService) { }

  /* ----------------------------------------------------------------------------
   * Returns true if academicTerm is bigger or equal to 2003/2004 and is not the
   * next term. Otherwise, return false.
   * (There's not enough info on degrees/courses to generate schedules otherwise.
   * ---------------------------------------------------------------------------- */
  private static validAcademicTerm(academicTerm: string): boolean {
    let currentTerm = new Date().getFullYear();
    return academicTerm >= '2003/2004' && academicTerm !== ++currentTerm + '/' + ++currentTerm;
  }

  private static hasTotalHoursPerWeek(hoursPerWeek: {}, lessons: Lesson[], shiftType: string): boolean {
    const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
    let totalHoursPerWeek = 0;
    for (const lesson of lessons) {
      totalHoursPerWeek += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
    }
    return totalHoursPerWeek === hoursPerWeek[shiftType];
  }

  private static isSameLesson(lesson1: Lesson, lesson2: Lesson): boolean {
    return new Date(lesson1.start).getTime() === new Date(lesson2.start).getTime();
  }

  private static isSameWeek(date1: Date, date2: Date): boolean {
    const MILLISECONDS_IN_A_WEEK = 604800000;
    const minDate = date1 < date2 ? date1 : date2;
    const maxDate = minDate === date1 ? date2 : date1;
    const minDayOfWeek = minDate.getDay();
    const maxDayOfWeek = maxDate.getDay();

    return !(maxDate.getTime() - minDate.getTime() >= MILLISECONDS_IN_A_WEEK || minDayOfWeek > maxDayOfWeek);
  }

  /* --------------------------------------------------------------------------------
   * Returns lessons for a given shift.
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - get hours/week of all types of lessons
   *  - build lessons for 1st week
   *  - if lessons are NOT according to total nr. hours/week, then repeat with
   *    next week until it is
   * (this strategy covers cases where there are days off in the 1st week of classes
   * -------------------------------------------------------------------------------- */
  private static getShiftLessons(courseLoads, lessons, shiftType): Lesson[] {
    const hoursPerWeek = {};
    let shiftLessons: Lesson[] = [];
    let weekIndex = 0;

    // Get hours/week of lessons
    for (const cl of courseLoads) {
      hoursPerWeek[cl.type] = parseFloat(cl.unitQuantity);
    }

    while (shiftLessons.length === 0 || !this.hasTotalHoursPerWeek(hoursPerWeek, shiftLessons, shiftType[0])) {
      if (weekIndex === lessons.length) { break; }

      shiftLessons = [];

      // Add lesson to compare to
      const baseLesson = new Lesson(
        new Date(lessons[weekIndex].start),
        new Date(lessons[weekIndex].end),
        lessons[weekIndex].room ? lessons[weekIndex].room.name : null,
        lessons[weekIndex].room ? lessons[weekIndex].room.topLevelSpace.name : null
      );
      shiftLessons.push(baseLesson);

      // Find others on same week
      for (const shiftLesson of lessons) {
        if (!this.isSameLesson(baseLesson, shiftLesson) && FenixService.isSameWeek(baseLesson.start, new Date(shiftLesson.start))) {
          const lesson = new Lesson(new Date(shiftLesson.start),
            new Date(shiftLesson.end),
            shiftLesson.room ? shiftLesson.room.name : null,
            shiftLesson.room ? shiftLesson.room.topLevelSpace.name : null);

          shiftLessons.push(lesson);
        }
      }

      weekIndex++;
    }

    return shiftLessons;
  }

  private static getCourseCampi(shifts: Shift[]): string[] {
    const campi: string[] = [];
    for (const shift of shifts) {
      for (const lesson of shift.lessons) {
        if (!campi.includes(lesson.campus) && lesson.campus) { campi.push(lesson.campus); }
      }
    }
    return campi;
  }

  /* ------------------------------------------------------------
   * Formats the type of class to one that's more readable
   * ------------------------------------------------------------ */
  private formatType(type: string): Type | string {
    switch (type) {
      case 'TEORICA':
        if (this.translateService.currentLang === 'pt-PT') { return Type.THEORY_PT; }
        return Type.THEORY_EN;

      case 'LABORATORIAL':
        if (this.translateService.currentLang === 'pt-PT') { return Type.LAB_PT; }
        return Type.LAB_EN;

      case 'PROBLEMS':
        if (this.translateService.currentLang === 'pt-PT') { return Type.PROBLEMS_PT; }
        return Type.PROBLEMS_EN;

      case 'SEMINARY':
        if (this.translateService.currentLang === 'pt-PT') { return Type.SEMINARY_PT; }
        return Type.SEMINARY_EN;

      case 'TUTORIAL_ORIENTATION':
        return Type.TUTORIAL_ORIENTATION;

      case 'TRAINING_PERIOD':
        return Type.TRAINING_PERIOD;

      default:
        const t = type.toLowerCase();
        return t[0].toUpperCase() + t.substr(1);
    }
  }

  private getLanguage(): string {
    return this.translateService.currentLang;
  }

  public httpGet(path: string): Promise<Response> {
    return fetch(this.url + path, {
      method: 'GET'
    });
  }

  getAcademicTerms(): Promise<string[]> {
    return this.httpGet('academicterms?lang=' + this.getLanguage())
      .then(r => r.json())
      .then(json => {
        return Object.keys(json).sort().reverse().filter((value) => FenixService.validAcademicTerm(value));
      });
  }

  getDegrees(academicTerm: string): Promise<Degree[]> {
    return this.httpGet('degrees?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(degreesJson => {
        const degrees: Degree[] = [];
        for (const degree of degreesJson) {
          degrees.push(new Degree(degree.id, degree.name, degree.acronym));
        }
        return degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getCoursesBasicInfo(academicTerm: string, degreeId: string): Promise<Course[]> {
    return this.httpGet('degrees/' + degreeId + '/courses?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(coursesJson => {
        const courses: Course[] = [];

        for (const course of coursesJson) {
          // Remove optional courses (example acronym: O32)
          if (course.acronym[0] === 'O' && course.acronym[1] >= '0' && course.acronym[1] <= '9') { continue; }

          courses.push(new Course(course.id, course.name, course.acronym));
        }

        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  loadMissingCourseInfo(course: Course): Promise<Course> {
    return this.httpGet('courses/' + course.id + '/schedule' + '?lang=' + this.getLanguage())
      .then(r => r.json())
      .then(scheduleJson => {

        // Get types
        const types: Type[] = this.getCourseTypes(scheduleJson.courseLoads);

        // Get shifts
        const shifts: Shift[] = [];
        for (const shift of scheduleJson.shifts) {

          // Get shift types
          const shiftTypes = this.getShiftTypes(shift.types);

          // Get shift lessons
          const shiftLessons = FenixService.getShiftLessons(scheduleJson.courseLoads, shift.lessons, shift.types);

          shifts.push(new Shift(shift.name, shiftTypes, shiftLessons));
        }

        // Get campi
        const campi: string[] = FenixService.getCourseCampi(shifts);

        return new Course(course.id, course.name, course.acronym, types, campi, shifts);
      });
  }

  private getCourseTypes(courseLoads): Type[] {
    const types = [];
    for (const cl of courseLoads) {
      const type = this.formatType(cl.type);
      types.push(type);
    }
    return types.reverse();
  }

  private getShiftTypes(types): Type[] {
    const shiftTypes = [];
    for (const shiftType of types) {
      const type = this.formatType(shiftType);
      shiftTypes.push(type);
    }
    return shiftTypes;
  }
}
