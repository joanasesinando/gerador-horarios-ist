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
import {StateService} from '../state/state.service';
import {AlertService} from '../../_util/alert.service';

declare let $;

const NO_ROOM_FOUND = 'NO ROOM FOUND';

@Injectable({
  providedIn: 'root'
})
export class FenixService {

  cors = 'https://ist-corsaway.onrender.com/';
  api = 'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/';
  currentAcademicTerm: string;

  constructor(
    public translateService: TranslateService,
    public errorService: ErrorService,
    public stateService: StateService,
    private alertService: AlertService
  ) { }

  /********************** CORRECT STRUCTURE **********************/

  parseDegree(degreeJson): Degree {
    if (!degreeJson.id) throw new Error('No ID found for degree');
    if (!degreeJson.name) throw new Error('No name found for degree ' + degreeJson.id);
    if (!degreeJson.acronym) throw new Error('No acronym found for degree ' + degreeJson.id);

    return new Degree(parseInt(degreeJson.id, 10), degreeJson.name, degreeJson.acronym);
  }

  async parseCourseBasicInfo(academicTerm: string, course, htmlCurriculum: HTMLHtmlElement, coursesNames,
                             cachedLinksHtml: {}): Promise<Course> {
    if (!course.id) throw new Error('No ID found for course');
    if (!course.name) throw new Error('No name found for course ' + course.id);
    if (!course.acronym) throw new Error('No acronym found for course ' + course.id);
    if (!course.credits) throw new Error('No credits found for course ' + course.id);
    if (!course.academicTerm) throw new Error('No academic term found for course ' + course.id);

    const period = await this.parseCoursePeriod(academicTerm, htmlCurriculum, course, coursesNames, cachedLinksHtml);

    return new Course(parseInt(course.id, 10), course.name, course.acronym, parseFloat(course.credits),
      parseInt(course.academicTerm[0], 10), period);
  }

  async parseCoursePeriod(academicTerm: string, htmlCurriculum: HTMLHtmlElement, course, coursesNames: string[],
                          cachedLinksHtml: {}): Promise<string> {
    if (!this.isMEPPAcademicTerm(academicTerm)) return null;

    let courseName = course.name;
    let courseURL = '';

    if (this.translateService.currentLang !== 'pt-PT')
      await this.httpGet('courses/' + course.id)
        .then(r => r.json())
        .then(coursePT => {
          courseName = coursePT.name;
          courseURL = coursePT.url;
        });
    courseName = courseName.trim();

    let text: string;
    let period: string;

    try {
      const uniquePeriods: string[] = [];
      const matches = $('a:contains(\'' + courseName + '\')', htmlCurriculum).filter((i, el) => {
        // Filter partial name matches
        const name: string = el.innerText.trim();
        return name === courseName || (name.startsWith(courseName) && name.endsWith(')'));

      }).filter((i, el) => {
        // Filter unique period matches
        const p: string = getPeriodFromText($(' + div', el).text());
        if (!uniquePeriods.includes(p)) {
          uniquePeriods.push(p);
          return true;
        }
        return false;
      });
      const nrMatches: number = matches.length;

      if (nrMatches === 0) {  // No matches found
        throw new Error('No matches found for course \'' + courseName + '\'');

      } else if (nrMatches === 1) { // Exactly one match found
        text = $(' + div', matches[0])[0].innerText;

      } else {  // Multiple matches found: course lectured in multiple periods
        // Find period based on semester
        // e.g. 1st semester -> P1 or P2
        //      2nd semester -> P3 or P4
        const semester: number = parseInt(course.academicTerm[0], 10);
        let notFound = false;
        matches.each((i, el) => {
          const p: string = $(' + div', el).text().split(',')[1].replace(/[ \t]/g, '');
          if ((semester === 1 && (p === 'P1' || p === 'P2' || (p.toLowerCase().startsWith('s') && p.includes('1')))) ||
            (semester === 2 && (p === 'P3' || p === 'P4' || (p.toLowerCase().startsWith('s') && p.includes('2'))))) {
            if (!period) period = p;
            else notFound = true;
          }
        });
        if (notFound) throw new Error('No period found for course \'' + courseName + '\'');
      }

    } catch (noMatchesFound) {
      let courseInfo = '';
      if (courseURL === '') {
        await this.httpGet('courses/' + course.id)
          .then(r => r.json())
          .then(c => courseURL = c.url);
      }

      const divs: HTMLDivElement[] = $('#bySemesters div.col-md-5', htmlCurriculum).toArray();

      const promises: Promise<any>[] = [];
      for (const div of divs) {
        const linkElement: HTMLAnchorElement = div.children[0] as HTMLAnchorElement;
        const link: string = linkElement.href;
        const name: string = linkElement.innerText;

        if (coursesNames.includes(name.trim())) continue;

        const textElement: HTMLElement = div.children[1] as HTMLElement;
        const info = textElement.innerText;

        if (link in cachedLinksHtml) {
          if ($('a[href$="' + courseURL + '"]', cachedLinksHtml[link]).length > 0) {
            courseInfo = info;
            break;
          } else {
            continue;
          }
        }

        promises.push(this.getCourseCurriculumPage(link).then(htmlLink => {
          cachedLinksHtml[link] = htmlLink;
          if ($('a[href$="' + courseURL + '"]', htmlLink).length > 0) {
            courseInfo = info;
          } else {
            return Promise.reject();
          }
        }));
      }

      await Promise.any(promises).catch(() => null);

      if (courseInfo) {
        text = courseInfo;
      } else {
        return null;
      }

    }

    if (text && period) {
      // NOTE: if course name is the same across periods,
      //       it might be necessary to fix the found period
      const p = text.split(',')[1].replace(/[ \t]/g, '');
      if (period !== p) period = p;

    } else if (!period) period = text.split(',')[1].replace(/[ \t]/g, '');

    // If course spans whole semester
    if (period.toLowerCase().startsWith('s'))
      period = 'Sem';

    return period;

    function getPeriodFromText(txt: string): string {
      return txt.split(',')[1].replace(/[ \t]/g, '');
    }
  }

  parseCourseMissingInfo(scheduleJson): void {
    if (!scheduleJson.shifts || scheduleJson.shifts.length === 0) throw new Error('No shifts found');
    scheduleJson.shifts.forEach(shift => {
      if (!shift.name || shift.name.isEmpty()) throw new Error('No name found for shift');
      if (!shift.types || shift.types.length === 0) throw new Error('No type found for shift ' + shift.name);
      if (!shift.lessons || shift.lessons.length === 0) {
        this.alertService.showAlert('Warning', 'No lessons found for shift ' + shift.name, 'warning');
        return;
      }

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
      case 'T':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.THEORY_PT;
        return ClassType.THEORY_EN;

      case 'PRATICA':
      case 'P':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.PRACTICE_PT;
        return ClassType.PRACTICE_EN;

      case 'LABORATORIAL':
      case 'L':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.LAB_PT;
        return ClassType.LAB_EN;

      case 'PROBLEMS':
      case 'PB':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.PROBLEMS_PT;
        return ClassType.PROBLEMS_EN;

      case 'TEORICO_PRATICA':
      case 'TP':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.TP_PT;
        return ClassType.TP_EN;

      case 'SEMINARY':
      case 'S':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.SEMINARY_PT;
        return ClassType.SEMINARY_EN;

      case 'TUTORIAL_ORIENTATION':
      case 'OT':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.TUTORIAL_ORIENTATION_PT;
        return ClassType.TUTORIAL_ORIENTATION_EN;

      case 'TRAINING_PERIOD':
      case 'E':
        if (this.translateService.currentLang === 'pt-PT') return ClassType.TRAINING_PERIOD_PT;
        return ClassType.TRAINING_PERIOD_EN;

      case 'FIELD_WORK':
      case 'TC':
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
    if (course.shifts.length === 0) throw new Error('No shifts found');
    return course;
  }


  /********************** HTTP REQUESTS **********************/

  public httpGet(path: string, api = true): Promise<Response> {
    return fetch(this.cors + (api ? this.api : '') + path, {
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
    return this.httpGet('degrees/all?lang=' + this.translateService.currentLang)
      .then(r => r.json())
      .then(degreesJson => {
        const degrees: Degree[] = [];
        for (let degree of degreesJson) {
          try {
            if (degree.academicTerms.includes(academicTerm)) {
              degree = this.parseDegree(degree);
              degrees.push(degree);
            }
          } catch (error) { this.errorService.showError(error, {
            While: 'Getting degress',
            academicTerm
          }); }
        }
        return degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getDegreeCurriculum(academicTerm: string, degreeId): Promise<HTMLHtmlElement> {
    const parser = new DOMParser();
    const acronym = this.stateService.degreesRepository.get(academicTerm)
      .find(degree => degree.id === parseInt(degreeId, 10)).acronym.toLowerCase();

    return this.httpGet('https://fenix.tecnico.ulisboa.pt/cursos/' + acronym + '/curriculo', false)
      .then(r => r.text())
      .then(html => {
        // Request curriculum on selected academic term
        const htmlEl = parser.parseFromString(html, 'text/html').getElementsByTagName('html')[0];
        const year = ($('div#content-block ul.dropdown-menu a:contains(\'' + academicTerm + '\')', htmlEl)[0].href).match(/year=(\d+)/)[1];

        return this.httpGet('https://fenix.tecnico.ulisboa.pt/cursos/' + acronym + '/curriculo?year=' + year, false)
          .then(r => r.text())
          .then(curriculumHTML => {
            return parser.parseFromString(curriculumHTML, 'text/html').getElementsByTagName('html')[0];
          });
      });
  }

  getCourseCurriculumPage(url: string): Promise<HTMLHtmlElement> {
    return this.httpGet(url, false)
      .then(r => r.text())
      .then(html => {
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html').getElementsByTagName('html')[0];
      });
  }

  getCoursesBasicInfo(academicTerm: string, degreeId: number): Promise<Course[]> {
    return this.httpGet('degrees/' + degreeId + '/courses?academicTerm=' + academicTerm + '&lang=' + this.translateService.currentLang)
      .then(r => r.json())
      .then(async coursesJson => {
        const htmlCurriculum = await this.getDegreeCurriculum(academicTerm, degreeId);

        const courses: Course[] = [];
        const coursesNames: string[] = coursesJson.map(c => c.name);
        const cachedLinksHtml: {} = {};
        for (let course of coursesJson) {
          try {
            course = await this.parseCourseBasicInfo(academicTerm, course, htmlCurriculum, coursesNames, cachedLinksHtml);

            // Remove optional courses (example acronym: O32)
            if (course.acronym[0] === 'O' && course.acronym[1] >= '0' && course.acronym[1] <= '9') continue;

            courses.push(course);
          } catch (error) {
            this.errorService.showError(error, {
              While: 'Getting courses basic info',
              academicTerm,
              degreeId
            });
          }
        }
        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getMissingCourseInfo(academicTerm: string, course: Course): Promise<Course> {
    return this.httpGet('courses/' + course.id + '/schedule' + '?lang=' + this.translateService.currentLang)
      .then(async r => {
        try {
          let shifts: Shift[] = [];

          if (r.status !== 200) {
            // Try to get schedule information through website
            const lessonsHTML = await this.httpGet('https://fenix.tecnico.ulisboa.pt/disciplinas/' + course.acronym + '/' +
              academicTerm.replace('/', '-') + '/' + course.semester + '-semestre/turnos', false)
              .then(res => res.text())
              .then(html => {
                const parser = new DOMParser();
                return parser.parseFromString(html, 'text/html').getElementsByTagName('html')[0];
            });

            const that = this;
            const rows = $('tbody tr', lessonsHTML);
            const lessonsOfShifts: {[shiftName: string]: Lesson[]} = {};
            for (const row of rows) {
              const shiftName: string = $('td:nth-child(1)', row)[0].innerText;
              if (!shiftName || shiftName.isEmpty()) throw new Error('No name found for shift');
              if (!(shiftName in lessonsOfShifts)) lessonsOfShifts[shiftName] = [];

              const date: string = $('td:nth-child(3)', row)[0].innerText;
              if (!date || date.isEmpty()) {
                that.alertService.showAlert('Warning', 'No lessons found for shift ' + shiftName, 'warning');
                continue;
              }

              const room = $('td:nth-child(4) a', row)[0];
              let roomName: string = room?.innerText;
              let roomCampus: string = null;
              if (!roomName || roomName.isEmpty()) roomName = NO_ROOM_FOUND;
              else {
                const roomID = room.href.split('/').at(-1);
                roomCampus = await that.httpGet('spaces/' + roomID)
                  .then(s => s.json())
                  .then(roomJson => roomJson.topLevelSpace.name);
              }

              lessonsOfShifts[shiftName].push(that.getShiftLesson(date.split(',')[0].trim(), date.split(',')[1].trim(),
                roomName, roomCampus));
            }

            for (const [shiftName, shiftLessons] of Object.entries(lessonsOfShifts)) {
              const shiftType = that.formatType(shiftName.replace(course.acronym, '').replace(/[0-9]+$/g, ''));
              shifts.push(new Shift(shiftName, shiftType, shiftLessons, shiftLessons.length > 0 ? shiftLessons[0].campus : null));
            }

          } else {
            const scheduleJson = await r.json();
            this.parseCourseMissingInfo(scheduleJson);

            // Get shifts
            shifts = this.getShifts(scheduleJson.shifts);
          }

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

        } catch (error) {
          if (error.message === 'No shifts found') {
            if (this.translateService.currentLang === 'pt-PT')
              this.alertService.showAlert('Sem horário', 'Sem horário disponível para a cadeira \'' + course.name + '\'', 'danger');
            else
              this.alertService.showAlert('No schedule', 'No schedule yet available for course \'' + course.name + '\'', 'danger');

          } else this.errorService.showError(error, {
            While: 'Getting missing course info',
            courseId: course.id,
            courseName: course.name,
            courseAcronym: course.acronym
          });
        }
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

  isMEPPAcademicTerm(academicTerm: string): boolean {
    return parseInt(academicTerm.split('/')[0], 10) >= 2021;
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
    let room: string = NO_ROOM_FOUND;

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
      if (room === NO_ROOM_FOUND && baseline.room !== NO_ROOM_FOUND) room = baseline.room;

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
          if (room === NO_ROOM_FOUND && shiftLesson.room !== NO_ROOM_FOUND) room = shiftLesson.room;
        }
      }

      // Update max value
      if (weekLessons.length > max) {
        max = weekLessons.length;
        shiftLessons = _.cloneDeep(weekLessons);
      }
    }

    // Set room if final lessons don't have
    if (room !== NO_ROOM_FOUND) {
      for (const lesson of shiftLessons)
        if (lesson.room === NO_ROOM_FOUND) lesson.room = room;
    }

    return shiftLessons;
  }

  getShiftLesson(weekday: string, time: string, room: string, campus: string): Lesson {
    let day: number;
    switch (weekday.toLowerCase()) {
      case 'segunda':
        day = 1;
        break;

      case 'terça':
        day = 2;
        break;

      case 'quarta':
        day = 3;
        break;

      case 'quinta':
        day = 4;
        break;

      case 'sexta':
        day = 5;
        break;

      default:
        throw new Error('Couldn\' match weekday.');
    }

    // Get the closest lesson weekday
    const start = new Date();
    start.setDate(start.getDate() + (day + 7 - start.getDay()) % 7);
    const end = new Date(start.valueOf());

    // Set lesson start and end times
    const startTime = time.split('—')[0].trim();
    const endTime = time.split('—')[1].trim();
    start.setHours(parseInt(startTime.split(':')[0], 10), parseInt(startTime.split(':')[1], 10), 0);
    end.setHours(parseInt(endTime.split(':')[0], 10), parseInt(endTime.split(':')[1], 10), 0);

    return new Lesson(start, end, room, campus);
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
