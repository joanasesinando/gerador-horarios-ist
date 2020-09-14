import {Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {LoggerService} from '../_util/logger.service';
import {Course} from '../_domain/Course';
import {Schedule} from '../_domain/Schedule';
import {Lesson} from '../_domain/Lesson';
import {Shift} from '../_domain/Shift';
import {Class} from '../_domain/Class';
import {ClassType} from '../_domain/ClassType';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {

  selectedCourses: Course[] = [];
  generatedSchedules: Schedule[] = [];

  scheduleInView = 0;
  schedulesPicked: Schedule[] = [];

  spinner = true;
  generationTime: number = null;

  mobileView = false;

  constructor(private logger: LoggerService, private router: Router) { }

  ngOnInit(): void {
    this.onWindowResize();
    // Receive selected courses
    const data = [ // FIXME: remove
      {
        _id: 1,
        _name: 'Course #1',
        _acronym: 'CArq123',
        _types: [ClassType.THEORY_PT, ClassType.LAB_PT],
        _campus: ['Alameda'],
        _shifts: [
          {
            _name: 'T01',
            _types: [ClassType.THEORY_PT],
            _lessons: [
              {
                _start: 'Mon Sep 07 2020 09:00:00 GMT+0100 (Western European Summer Time)',
                _end: 'Mon Sep 07 2020 10:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R1',
                _campus: 'Alameda'
              },
              {
                _start: 'Wed Sep 09 2020 18:30:00 GMT+0100 (Western European Summer Time)',
                _end: 'Wed Sep 09 2020 20:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R1',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          },
          {
            _name: 'L01',
            _types: [ClassType.LAB_PT],
            _lessons: [
              {
                _start: 'Tue Sep 08 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                _end: 'Tue Sep 08 2020 13:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R2',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          },
          {
            _name: 'L01',
            _types: [ClassType.LAB_PT],
            _lessons: [
              {
                _start: 'Fri Sep 11 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                _end: 'Fri Sep 11 2020 13:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R2',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          },
          {
            _name: 'L01',
            _types: [ClassType.LAB_PT],
            _lessons: [
              {
                _start: 'Fri Sep 11 2020 13:30:00 GMT+0100 (Western European Summer Time)',
                _end: 'Fri Sep 11 2020 14:30:00 GMT+0100 (Western European Summer Time)',
                _room: 'R2',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          }
        ],
        _courseLoads: { Teórica: 3, Laboratorial: 1.5 }
      },
      {
        _id: 2,
        _name: 'Course #2',
        _acronym: 'BD123',
        _types: [ClassType.THEORY_PT],
        _campus: ['Alameda'],
        _shifts: [
          {
            _name: 'T01',
            _types: [ClassType.THEORY_PT],
            _lessons: [
              {
                _start: 'Mon Sep 07 2020 13:00:00 GMT+0100 (Western European Summer Time)',
                _end: 'Mon Sep 07 2020 14:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R1',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          },
          {
            _name: 'T01',
            _types: [ClassType.THEORY_PT],
            _lessons: [
              {
                _start: 'Mon Sep 07 2020 14:00:00 GMT+0100 (Western European Summer Time)',
                _end: 'Mon Sep 07 2020 15:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R1',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          },
          {
            _name: 'T01',
            _types: [ClassType.THEORY_PT],
            _lessons: [
              {
                _start: 'Mon Sep 07 2020 16:00:00 GMT+0100 (Western European Summer Time)',
                _end: 'Mon Sep 07 2020 17:00:00 GMT+0100 (Western European Summer Time)',
                _room: 'R1',
                _campus: 'Alameda'
              }
            ],
            _campus: 'Alameda'
          }
        ],
        _courseLoads: { Teórica: 1 }
      }
    ];
    // const data = history.state.data; // FIXME: uncomment
    // if (!data) { this.router.navigate(['/']); return; } // FIXME: uncomment
    this.selectedCourses = this.parseCourses(data);
    this.logger.log('courses to generate', this.selectedCourses);

    // Generate schedules
    this.generatedSchedules = this.generateSchedules();
    this.logger.log('generated schedules', this.generatedSchedules);

    // Fake staling for UX
    this.generationTime != null && this.generationTime < 1000 ?
      setTimeout(() => this.spinner = false, 1000) : this.spinner = false;
  }

  parseCourses(data: {_id, _name, _acronym, _types, _campus, _shifts, _courseLoads}[]): Course[] {
    const courses: Course[] = [];
    for (const obj of data) {
      const course = new Course(obj._id, obj._name, obj._acronym, obj._types, obj._campus);

      // Parse shifts
      const shifts: Shift[] = [];
      if (obj._shifts && obj._shifts !== []) {
        for (const shift of obj._shifts) {
          const lessons: Lesson[] = [];
          for (const lesson of shift._lessons) {
            lessons.push(new Lesson(new Date(lesson._start), new Date(lesson._end), lesson._room, lesson._campus));
          }
          shifts.push(new Shift(shift._name, shift._types, lessons, shift._campus));
        }
      }
      course.shifts = shifts;

      course.courseLoads = obj._courseLoads;
      courses.push(course);
    }
    return courses;
  }

  /* --------------------------------------------------------------------------------
   * Returns generated schedules based on user selected courses.
   * --------------------------------------------------------------------------------
   * [Algorithm]
   *  - get all combinations of shifts for a given course (taking into account hours
   *    per week of each type of class selected); check for overlaps and discard
   *  - combine each to create different schedules; check for overlaps and discard
   * -------------------------------------------------------------------------------- */
  generateSchedules(): Schedule[] {
    this.logger.log('generating...');
    const t0 = performance.now();

    // Combine shifts
    const classesPerCourse: Class[][] = [];
    for (const course of this.selectedCourses) {
      const classes = this.combineShifts(course);
      classesPerCourse.push(classes);
    }

    // Combine classes
    const schedules: Schedule[] = this.combineClasses(classesPerCourse);

    this.logger.log('done');
    const t1 = performance.now();
    this.generationTime = t1 - t0;
    this.logger.log('generated in (milliseconds)', this.generationTime);

    return schedules;
  }

  combineShifts(course: Course): Class[] {
    const shiftsMap = new Map<string, Shift[]>();
    const shiftsArray: Shift[][] = [];

    // Group shifts based on type of class
    // NOTE: potential bug
    //  types.length > 1 && type[0] equal e.g. another type on shift w/ types.length == 1
    for (const shift of course.shifts) {
      const type = shift.types[0];
      shiftsMap.has(type) ? shiftsMap.get(type).push(shift) : shiftsMap.set(type, [shift]);
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

  pickShowOption(event): void {
    // TODO;
    console.log(event.innerText);
  }

  addSchedule(scheduleIndex: number): void {
    // TODO: show warning if adding one already added
    const scheduleToAdd = this.generatedSchedules[scheduleIndex];
    if (!this.schedulesPicked.includes(scheduleToAdd)) {
      this.schedulesPicked.push(this.generatedSchedules[scheduleIndex]);
    }
    this.logger.log('schedules picked', this.schedulesPicked);
  }

  finish(): void {
    // TODO
    console.log('finish');
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
  }
}
