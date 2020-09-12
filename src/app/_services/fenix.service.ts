import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {Course} from '../_domain/Course';
import {Degree} from '../_domain/Degree';
import {Lesson} from '../_domain/Lesson';
import {Shift} from '../_domain/Shift';
import {ClassType} from '../_domain/ClassType';


@Injectable({
  providedIn: 'root'
})
export class FenixService {

  url = 'https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/';
  errorInAPI = false;

  constructor(public translateService: TranslateService) { }

  /* ----------------------------------------------------------------------------
   * Returns true if academicTerm is bigger or equal to 2003/2004.
   * Otherwise, return false.
   * ----------------------------------------------------------------------------
   * [Reason]
   * There's not enough info on degrees and courses on academic terms smaller than
   * 2003/2004 to generate schedules.
   * ---------------------------------------------------------------------------- */
  private static validAcademicTerm(academicTerm: string): boolean {
    return academicTerm >= '2003/2004';
  }

  private static parseDegree(degree): Degree {
    if (!degree.id) { throw new Error('No ID found for degree'); }
    if (!degree.name) { throw new Error('No name found for degree ' + degree.id); }
    if (!degree.acronym) { throw new Error('No acronym found for degree ' + degree.id); }

    return new Degree(degree.id, degree.name, degree.acronym);
  }

  private static parseCourseBasicInfo(course): Course {
    if (!course.id) { throw new Error('No ID found for course'); }
    if (!course.name) { throw new Error('No name found for course ' + course.id); }
    if (!course.acronym) { throw new Error('No acronym found for course ' + course.id); }

    return new Course(course.id, course.name, course.acronym);
  }

  private static parseCourseMissingInfo(scheduleJson): void {
    if (!scheduleJson.courseLoads) { throw new Error('No courseLoads found'); }
    scheduleJson.courseLoads.forEach(cl => {
      if (!cl.type) { throw new Error('No type found in courseLoads'); }
      if (!cl.unitQuantity) { throw new Error('No unitQuantity found in courseLoads'); }
    });

    if (!scheduleJson.shifts) { throw new Error('No shifts found'); }
    scheduleJson.shifts.forEach(shift => {
      if (!shift.name) { throw new Error('No name found for shift'); }
      if (!shift.types) { throw new Error('No types found for shift ' + shift.name); }
      if (!shift.lessons) { throw new Error('No lessons found for shift ' + shift.name); }

      shift.lessons.forEach(lesson => {
        if (!lesson.start) { throw new Error('No start found for lesson'); }
        if (!lesson.end) { throw new Error('No end found for lesson'); }
        if (!lesson.room) { throw new Error('No room found for lesson'); }
      });
      if (!shift.rooms) { throw new Error('No rooms found for shift ' + shift.name); }
    });
  }

  /* ----------------------------------------------------------------------------
   * Fill-in missing info that's not crucial for generating schedules.
   * ---------------------------------------------------------------------------- */
  private static fillMissingInfo(course: Course): Course {
    if (course.campus.length === 0) { course.campus = ['NONE FOUND']; }
    if (course.types.length === 0) { course.types = [ClassType.NONE]; }
    if (course.shifts.length === 0) {
      throw new Error('No shifts found. Impossible to generate schedules for course: ' + course.name);
    }
    return course;
  }

  private static getCourseLoads(courseLoads): {} {
    const loads = {};
    for (const cl of courseLoads) {
      loads[cl.type] = parseFloat(cl.unitQuantity);
    }
    return loads;
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

  private static calculateCourseLoads(shifts: Shift[]): {} {
    const courseLoads = {};
    for (const shift of shifts) {
      const type = shift.types[0];
      if (!courseLoads[type]) {
        const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
        let totalHours = 0;
        for (const lesson of shift.lessons) {
          totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
        }
        courseLoads[type] = totalHours;
      }
    }
    return courseLoads;
  }

  /* --------------------------------------------------------------------------------
   * Returns lessons for a given shift.
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - build lessons for 1st week
   *  - if lessons are NOT according to total nr. hours/week, then repeat with
   *    next week until it is
   * (this strategy covers cases where there are days off in the 1st week of classes)
   * -------------------------------------------------------------------------------- */
  private getShiftLessons(hoursPerWeek, lessons, shiftType): Lesson[] {
    let shiftLessons: Lesson[] = [];
    let weekIndex = 0;

    while (shiftLessons.length === 0 || !FenixService.hasTotalHoursPerWeek(hoursPerWeek, shiftLessons, shiftType[0])) {
      if (weekIndex === lessons.length) {
        this.errorInAPI = true;
        break;
      }

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
        if (!FenixService.isSameLesson(baseLesson, shiftLesson) && FenixService.isSameWeek(baseLesson.start, new Date(shiftLesson.start))) {
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

  /* ------------------------------------------------------------
   * Formats the type of class to one that's more readable
   * ------------------------------------------------------------ */
  private formatType(type: string): ClassType | string {
    switch (type) {
      case 'TEORICA':
        if (this.translateService.currentLang === 'pt-PT') { return ClassType.THEORY_PT; }
        return ClassType.THEORY_EN;

      case 'LABORATORIAL':
        if (this.translateService.currentLang === 'pt-PT') { return ClassType.LAB_PT; }
        return ClassType.LAB_EN;

      case 'PROBLEMS':
        if (this.translateService.currentLang === 'pt-PT') { return ClassType.PROBLEMS_PT; }
        return ClassType.PROBLEMS_EN;

      case 'SEMINARY':
        if (this.translateService.currentLang === 'pt-PT') { return ClassType.SEMINARY_PT; }
        return ClassType.SEMINARY_EN;

      case 'TUTORIAL_ORIENTATION':
        return ClassType.TUTORIAL_ORIENTATION;

      case 'TRAINING_PERIOD':
        return ClassType.TRAINING_PERIOD;

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

  getDegrees(academicTerm: string): Promise<Degree[]> { // TODO: testing
    return this.httpGet('degrees?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(degreesJson => {
        const degrees: Degree[] = [];
        for (let degree of degreesJson) {
          try {
            degree = FenixService.parseDegree(degree);
            degrees.push(degree);
          } catch (error) { console.error(error); }
        }
        return degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getCoursesBasicInfo(academicTerm: string, degreeId: number): Promise<Course[]> { // TODO: testing
    return this.httpGet('degrees/' + degreeId + '/courses?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(coursesJson => {
        const courses: Course[] = [];

        for (let course of coursesJson) {
          try {
            course = FenixService.parseCourseBasicInfo(course);

            // Remove optional courses (example acronym: O32)
            if (course.acronym[0] === 'O' && course.acronym[1] >= '0' && course.acronym[1] <= '9') { continue; }

            courses.push(course);
          } catch (error) { console.error(error); }
        }

        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  loadMissingCourseInfo(course: Course): Promise<Course> { // TODO: testing
    return this.httpGet('courses/' + course.id + '/schedule' + '?lang=' + this.getLanguage())
      .then(r => r.json())
      .then(scheduleJson => {
        try {
          FenixService.parseCourseMissingInfo(scheduleJson);

          // Get types
          const types: ClassType[] = this.getCourseTypes(scheduleJson.courseLoads);

          // Get course loads
          let courseLoads = FenixService.getCourseLoads(scheduleJson.courseLoads);

          // Get shifts
          const shifts: Shift[] = [];
          for (const shift of scheduleJson.shifts) {

            // Get shift types
            const shiftTypes = this.getShiftTypes(shift.types);

            // Get shift lessons
            const shiftLessons = this.getShiftLessons(courseLoads, shift.lessons, shift.types);

            // Get shift campus
            const shiftCampus = shiftLessons[0].campus;

            shifts.push(new Shift(shift.name, shiftTypes, shiftLessons, shiftCampus));
          }

          // Get campi
          const campi: string[] = FenixService.getCourseCampi(shifts).reverse();

          // Update courseLoads if inconsistencies found
          if (this.errorInAPI) {
            courseLoads = FenixService.calculateCourseLoads(shifts);
            this.errorInAPI = false;
          }

          return FenixService.fillMissingInfo(new Course(course.id, course.name, course.acronym, types, campi, shifts, courseLoads));
        } catch (error) { console.error(error); }
      });
  }

  private getCourseTypes(courseLoads): ClassType[] {
    const types = [];
    for (const cl of courseLoads) {
      const type = this.formatType(cl.type);
      types.push(type);
    }
    return types.reverse();
  }

  private getShiftTypes(types): ClassType[] {
    const shiftTypes = [];
    for (const shiftType of types) {
      const type = this.formatType(shiftType);
      shiftTypes.push(type);
    }
    return shiftTypes;
  }
}
