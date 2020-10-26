import {Injectable} from '@angular/core';

import {TranslateService} from '@ngx-translate/core';
import {ErrorService} from '../../_util/error.service';

import {Course} from '../../_domain/Course/Course';
import {Degree} from '../../_domain/Degree/Degree';
import {Lesson} from '../../_domain/Lesson/Lesson';
import {Shift} from '../../_domain/Shift/Shift';
import {ClassType, getClassTypeOrder} from '../../_domain/ClassType/ClassType';
import {isSameWeek} from '../../_util/Time';

const NO_ROOM_FOUND = 'NO ROOM FOUND';

@Injectable({
  providedIn: 'root'
})
export class FenixService {

  url = 'https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/';

  totalHoursPerWeekDoNotMatchLessonsTime = false;
  campusNotFound = false;
  currentAcademicTerm: string;

  constructor(public translateService: TranslateService, public errorService: ErrorService) { }

  /********************** CORRECT STRUCTURE **********************/

  parseDegree(degreeJson): Degree {
    if (!degreeJson.id) { throw new Error('No ID found for degree'); }
    if (!degreeJson.name) { throw new Error('No name found for degree ' + degreeJson.id); }
    if (!degreeJson.acronym) { throw new Error('No acronym found for degree ' + degreeJson.id); }

    return new Degree(degreeJson.id, degreeJson.name, degreeJson.acronym);
  }

  parseCourseBasicInfo(course): Course {
    if (!course.id) { throw new Error('No ID found for course'); }
    if (!course.name) { throw new Error('No name found for course ' + course.id); }
    if (!course.acronym) { throw new Error('No acronym found for course ' + course.id); }

    return new Course(course.id, course.name, course.acronym);
  }

  parseCourseMissingInfo(scheduleJson): void {
    if (!scheduleJson.courseLoads) { throw new Error('No courseLoads found'); }
    scheduleJson.courseLoads.forEach(cl => {
      if (!cl.type && cl.type !== '') { throw new Error('No type found in courseLoads'); }
      if (!cl.unitQuantity && cl.unitQuantity !== 0) { throw new Error('No unitQuantity found in courseLoads'); }
    });

    if (!scheduleJson.shifts) { throw new Error('No shifts found'); }
    scheduleJson.shifts.forEach(shift => {
      if (!shift.name) { throw new Error('No name found for shift'); }
      if (!shift.types) { throw new Error('No type found for shift ' + shift.name); }
      if (!shift.lessons) { throw new Error('No lessons found for shift ' + shift.name); }

      shift.lessons.forEach(lesson => {
        if (!lesson.start && lesson.start !== '') { throw new Error('No start found for lesson'); }
        if (!lesson.end && lesson.end !== '') { throw new Error('No end found for lesson'); }
      });
    });
  }

  // Formats the type of class to one that's more readable
  formatType(type: string): ClassType {
    switch (type) {
      case 'TEORICA':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.THEORY_PT;
        return ClassType.THEORY_EN;

      case 'LABORATORIAL':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.LAB_PT;
        return ClassType.LAB_EN;

      case 'PROBLEMS':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.PROBLEMS_PT;
        return ClassType.PROBLEMS_EN;

      case 'SEMINARY':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.SEMINARY_PT;
        return ClassType.SEMINARY_EN;

      case 'TUTORIAL_ORIENTATION':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.TUTORIAL_ORIENTATION_PT;
        return ClassType.TUTORIAL_ORIENTATION_EN;

      case 'TRAINING_PERIOD':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.TRAINING_PERIOD_PT;
        return ClassType.TRAINING_PERIOD_EN;

      case 'FIELD_WORK':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.FIELD_WORK_PT;
        return ClassType.FIELD_WORK_EN;

      default:
        return ClassType.NONE;
    }
  }

  // Fill-in missing info that's not crucial for generating schedules
  fillMissingInfo(course: Course): Course {
    if (course.campus.length === 0) { course.campus = null; }
    if (course.types.length === 0) { course.types = [ClassType.NONE]; }
    if (course.shifts.length === 0) {
      throw new Error('No shifts found. Impossible to generate schedules for course: ' + course.name);
    }
    return course;
  }

  hasTotalHoursPerWeek(hoursPerWeek: {}, lessons: Lesson[], shiftType: string): boolean {
    const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
    let totalHoursPerWeek = 0;
    for (const lesson of lessons)
      totalHoursPerWeek += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
    return totalHoursPerWeek === hoursPerWeek[shiftType];
  }


  /********************** HTTP REQUESTS **********************/

  private getLanguage(): string {
    return this.translateService.currentLang;
  }

  public httpGet(path: string): Promise<Response> {
    return fetch(this.url + path, {
      method: 'GET'
    });
  }

  getCurrentAcademicTerm(): Promise<string> {
    return this.httpGet('about')
      .then(r => r.json())
      .then(json => {
        return json.currentAcademicTerm.split(' ')[2];
      });
  }

  getDegrees(academicTerm: string): Promise<Degree[]> { // TODO: testing
    return this.httpGet('degrees?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(degreesJson => {
        const degrees: Degree[] = [];
        for (let degree of degreesJson) {
          try {
            degree = this.parseDegree(degree);
            degrees.push(degree);
          } catch (error) { this.errorService.showError(error); }
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
            course = this.parseCourseBasicInfo(course);

            // Remove optional courses (example acronym: O32)
            if (course.acronym[0] === 'O' && course.acronym[1] >= '0' && course.acronym[1] <= '9') { continue; }

            courses.push(course);
          } catch (error) { this.errorService.showError(error); }
        }

        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  loadMissingCourseInfo(course: Course): Promise<Course> { // TODO: testing
    return this.httpGet('courses/' + course.id + '/schedule' + '?lang=' + this.getLanguage())
      .then(r => r.json())
      .then(scheduleJson => {
        try {
          this.parseCourseMissingInfo(scheduleJson);

          // Get types
          const types: ClassType[] = this.getCourseTypes(scheduleJson.courseLoads);

          // Get course loads
          let courseLoads = this.getCourseLoads(scheduleJson.courseLoads);

          // Get shifts
          let shifts = this.getShifts(scheduleJson.shifts, courseLoads);

          // Get campus
          const campus: string[] = this.getCourseCampus(shifts);

          // Update courseLoads & shifts if inconsistencies found
          if (this.totalHoursPerWeekDoNotMatchLessonsTime) {
            courseLoads = this.calculateCourseLoads(shifts);
            shifts = this.getShifts(scheduleJson.shifts, courseLoads);
            this.totalHoursPerWeekDoNotMatchLessonsTime = false;
          }

          // Set shifts' & lessons' campus if none found, but found on course
          shifts.forEach(shift => {
            if (!shift.campus && campus && campus.length === 1) { shift.campus = campus[0]; }

            shift.lessons.forEach(lesson => {
              if (!lesson.campus && shift.campus) { lesson.campus = shift.campus; }
            });
          });

          course.types = types;
          course.campus = campus;
          course.shifts = shifts;
          course.courseLoads = courseLoads;

          return this.fillMissingInfo(course);

        } catch (error) { this.errorService.showError(error); }
      });
  }


  /********************** ACADEMIC TERM RELATED **********************/

  getNextAcademicTerm(academicTerm: string): string {
    const first = parseInt(academicTerm.split('/')[0], 10);
    const second = parseInt(academicTerm.split('/')[1], 10);
    return (first + 1) + '/' + (second + 1);
  }

  async getAcademicTerms(): Promise<string[]> {
    this.currentAcademicTerm = await this.getCurrentAcademicTerm();
    return [this.currentAcademicTerm, this.getNextAcademicTerm(this.currentAcademicTerm)];
  }


  /********************** COURSE RELATED **********************/

  getCourseLoads(courseLoads): {} {
    const loads = {};
    for (const cl of courseLoads)
      loads[cl.type] = parseFloat(cl.unitQuantity);
    return loads;
  }

  calculateCourseLoads(shifts: Shift[]): {} {
    const courseLoads = {};
    for (const shift of shifts) {
      const type = shift.type;
      const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
      let totalHours = 0;

      for (const lesson of shift.lessons)
        totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;

      if (!courseLoads[type] || courseLoads[type] < totalHours)
        courseLoads[type] = totalHours;
    }
    return courseLoads;
  }

  getCourseCampus(shifts: Shift[]): string[] {
    const campus: string[] = [];
    for (const shift of shifts)
      for (const lesson of shift.lessons)
        if (!campus.includes(lesson.campus) && lesson.campus) campus.push(lesson.campus);
    return campus.sort();
  }

  getCourseTypes(courseLoads): ClassType[] {
    const types: ClassType[] = [];
    for (const cl of courseLoads)
      types.push(this.formatType(cl.type));
    return types.sort((a, b) => getClassTypeOrder(a) - getClassTypeOrder(b));
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

    while (shiftLessons.length === 0 || !this.hasTotalHoursPerWeek(hoursPerWeek, shiftLessons, shiftType)) {
      // Total hours per week are incorrect
      if (weekIndex === lessons.length) {
        this.totalHoursPerWeekDoNotMatchLessonsTime = true;
        break;
      }

      shiftLessons = [];

      // Add lesson to compare to
      const baseLesson = new Lesson(
        new Date(lessons[weekIndex].start),
        new Date(lessons[weekIndex].end),
        lessons[weekIndex].room ? lessons[weekIndex].room.name : NO_ROOM_FOUND,
        lessons[weekIndex].room ? lessons[weekIndex].room.topLevelSpace.name : null
      );
      shiftLessons.push(baseLesson);
      if (!baseLesson.campus) { this.campusNotFound = true; }

      // Find others on same week
      for (const shiftLesson of lessons) {
        if (!shiftLesson.equal(baseLesson) && isSameWeek(baseLesson.start, new Date(shiftLesson.start))) {
          const lesson = new Lesson(new Date(shiftLesson.start),
            new Date(shiftLesson.end),
            shiftLesson.room ? shiftLesson.room.name : NO_ROOM_FOUND,
            shiftLesson.room ? shiftLesson.room.topLevelSpace.name : null
          );
          shiftLessons.push(lesson);
          if (!baseLesson.campus) { this.campusNotFound = true; }
        }
      }

      weekIndex++;
    }

    return shiftLessons;
  }

  private getShifts(shiftsJson, courseLoads): Shift[] {
    const shifts: Shift[] = [];
    for (const shift of shiftsJson) {

      // Get shift type
      const shiftType = this.formatType(shift.types[0]);

      // Get shift lessons
      const shiftLessons = this.getShiftLessons(courseLoads, shift.lessons, shiftType);

      // Get shift campus
      const shiftCampus = shiftLessons[0].campus;

      shifts.push(new Shift(shift.name, shiftType, shiftLessons, shiftCampus));
    }
    return shifts;
  }
}
