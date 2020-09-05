import { Component, OnInit } from '@angular/core';

import {LoggerService} from '../_util/logger.service';
import {Course, Lesson, Shift} from '../_domain/Course';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {

  selectedCourses: Course[] = [];

  constructor(private logger: LoggerService) { }

  ngOnInit(): void {
    this.selectedCourses = this.parseCourses(history.state.data);
    this.logger.log('courses to generate', this.selectedCourses);
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
          shifts.push(new Shift(shift._name, shift._types, lessons));
        }
      }
      course.shifts = shifts;

      course.courseLoads = obj._courseLoads;
      courses.push(course);
    }
    return courses;
  }

}
