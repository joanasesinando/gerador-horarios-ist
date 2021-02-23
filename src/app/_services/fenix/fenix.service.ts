import {Injectable} from '@angular/core';

import {TranslateService} from '@ngx-translate/core';
import {ErrorService} from '../../_util/error.service';
import _ from 'lodash';

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

  url = 'https://ist-corsaway.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/';
  currentAcademicTerm: string;

  constructor(public translateService: TranslateService, public errorService: ErrorService) { }

  /********************** CORRECT STRUCTURE **********************/

  parseDegree(degreeJson): Degree {
    if (!degreeJson.id) throw new Error('No ID found for degree');
    if (!degreeJson.name) throw new Error('No name found for degree ' + degreeJson.id);
    if (!degreeJson.acronym) throw new Error('No acronym found for degree ' + degreeJson.id);

    return new Degree(parseInt(degreeJson.id, 10), degreeJson.name, degreeJson.acronym);
  }

  parseCourseBasicInfo(course): Course {
    if (!course.id) throw new Error('No ID found for course');
    if (!course.name) throw new Error('No name found for course ' + course.id);
    if (!course.acronym) throw new Error('No acronym found for course ' + course.id);
    if (!course.credits) throw new Error('No credits found for course ' + course.id);
    if (!course.academicTerm) throw new Error('No academic term found for course ' + course.id);

    return new Course(parseInt(course.id, 10), course.name, course.acronym, parseFloat(course.credits),
      parseInt(course.academicTerm[0], 10));
  }

  parseCourseMissingInfo(scheduleJson): void {
    if (!scheduleJson.shifts) throw new Error('No shifts found');
    scheduleJson.shifts.forEach(shift => {
      if (!shift.name) throw new Error('No name found for shift');
      if (!shift.types || shift.types.length === 0) throw new Error('No type found for shift ' + shift.name);
      if (!shift.lessons) throw new Error('No lessons found for shift ' + shift.name);

      shift.lessons.forEach(lesson => {
        if (!lesson.start) throw new Error('No start found for lesson');
        if (!lesson.end) throw new Error('No end found for lesson');
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
    if (course.campus.length === 0) course.campus = null;
    if (course.types.length === 0) course.types = [ClassType.NONE];
    if (course.shifts.length === 0)
      throw new Error('No shifts found. Impossible to generate schedules for course: ' + course.name);
    return course;
  }


  /********************** HTTP REQUESTS **********************/

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

  getDegrees(academicTerm: string): Promise<Degree[]> {
    return this.httpGet('degrees?academicTerm=' + academicTerm + '&lang=' + this.translateService.currentLang)
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

  getCoursesBasicInfo(academicTerm: string, degreeId: number): Promise<Course[]> {
    return this.httpGet('degrees/' + degreeId + '/courses?academicTerm=' + academicTerm + '&lang=' + this.translateService.currentLang)
      .then(r => r.json())
      .then(coursesJson => {
        const courses: Course[] = [];
        for (let course of coursesJson) {
          try {
            course = this.parseCourseBasicInfo(course);

            // Remove optional courses (example acronym: O32)
            if (course.acronym[0] === 'O' && course.acronym[1] >= '0' && course.acronym[1] <= '9') continue;

            courses.push(course);
          } catch (error) { this.errorService.showError(error); }
        }
        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getMissingCourseInfo(course: Course): Promise<Course> {
    return this.httpGet('courses/' + course.id + '/schedule' + '?lang=' + this.translateService.currentLang)
      .then(r => r.json())
      .then(scheduleJson => {
        try {
          this.parseCourseMissingInfo(scheduleJson);

          // Get shifts
          const shifts = this.getShifts(scheduleJson.shifts);

          // Get types
          const types: ClassType[] = this.getCourseTypes(shifts);

          // Get course loads
          const courseLoads = this.calculateCourseLoads(shifts);

          // Get campus
          const campus: string[] = this.getCourseCampus(shifts);

          // Set shifts' & lessons' campus if none found, but found on course
          shifts.forEach(shift => {
            if (!shift.campus && campus && campus.length === 1) shift.campus = campus[0];

            shift.lessons.forEach(lesson => {
              if (!lesson.campus && shift.campus) lesson.campus = shift.campus;
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

  calculateCourseLoads(shifts: Shift[]): {} {
    const courseLoads: {[key: string]: number} = {};
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

  getCourseTypes(shifts: Shift[]): ClassType[] {
    const types: ClassType[] = [];
    for (const shift of shifts) {
      if (!types.includes(shift.type)) types.push(shift.type);
    }
    return types.sort((a, b) => getClassTypeOrder(a) - getClassTypeOrder(b));
  }

  /* --------------------------------------------------------------------------------
   * Returns lessons for a given shift.
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - iterate through the weeks and count number of lessons
   *  - return lessons on a week with the highest number of lessons
   * (this is to account for holidays and off days)
   * -------------------------------------------------------------------------------- */
  getShiftLessons(lessons: {start: string, end: string, room?: {name: string, topLevelSpace?: {name: string}}}[]): Lesson[] {
    let weekLessons: Lesson[] = [];
    let shiftLessons: Lesson[] = [];
    let max = 0;
    let room: string = null;

    while (lessons.length !== 0) {
      weekLessons = [];

      // Set baseline
      const baseline = new Lesson(
        new Date(lessons[0].start),
        new Date(lessons[0].end),
        lessons[0].room ? lessons[0].room.name : NO_ROOM_FOUND,
        lessons[0].room && lessons[0].room.topLevelSpace ? lessons[0].room.topLevelSpace.name : null
      );
      weekLessons.push(baseline);
      lessons.shift();
      if (!room && baseline.room && baseline.room !== NO_ROOM_FOUND) room = baseline.room;

      // Find lessons on same week as baseline
      for (let i = lessons.length - 1; i >= 0; i--) {
        const shiftLesson = new Lesson(
          new Date(lessons[i].start),
          new Date(lessons[i].end),
          lessons[i].room ? lessons[i].room.name : NO_ROOM_FOUND,
          lessons[i].room && lessons[i].room.topLevelSpace ? lessons[i].room.topLevelSpace.name : null
        );

        if (!shiftLesson.equal(baseline) && isSameWeek(baseline.start, shiftLesson.start)) {
          weekLessons.push(shiftLesson);
          lessons.splice(i, 1);
          if (!room && shiftLesson.room && shiftLesson.room !== NO_ROOM_FOUND) room = shiftLesson.room;
        }
      }

      // Update max value
      if (weekLessons.length > max) {
        max = weekLessons.length;
        shiftLessons = _.cloneDeep(weekLessons);
      }
    }

    // Set room if final lessons don't have
    for (const lesson of shiftLessons)
      if (!lesson.room || lesson.room === NO_ROOM_FOUND) lesson.room = room;

    return shiftLessons;
  }

  getShifts(shiftsJson): Shift[] {
    const shifts: Shift[] = [];
    for (const shift of shiftsJson) {
      if (shift.lessons.length === 0) continue;

      // Get shift type
      const shiftType = this.formatType(shift.types[0]);

      // Get shift lessons
      const shiftLessons = this.getShiftLessons(shift.lessons);

      // Get shift campus
      const shiftCampus = shiftLessons.length > 0 ? shiftLessons[0].campus : null;

      shifts.push(new Shift(shift.name, shiftType, shiftLessons, shiftCampus));
    }
    return shifts;
  }
}
