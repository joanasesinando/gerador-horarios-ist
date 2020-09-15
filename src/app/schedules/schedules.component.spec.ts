import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';

import {SchedulesComponent} from './schedules.component';

import {RouterTestingModule} from '@angular/router/testing';

import {ClassType} from '../_domain/ClassType';
import {parseCourses} from '../_domain/Course';


describe('SchedulesComponent', () => {
  let component: SchedulesComponent;
  let fixture: ComponentFixture<SchedulesComponent>;
  let de: DebugElement;

  let data: {selectedCourses: any, academicTerm: string, degreeID: number};

  beforeEach(async(() => {
    data = {
      selectedCourses: [
        {
          _id: 1,
          _name: 'Course #1',
          _acronym: 'C1',
          _types: [ClassType.THEORY_PT, ClassType.LAB_PT],
          _campus: ['Alameda'],
          _shifts: [
            {
              _name: 'T01',
              _types: [ClassType.THEORY_PT],
              _lessons: [
                {
                  _start: 'Mon Sep 07 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                  _end: 'Mon Sep 07 2020 11:00:00 GMT+0100 (Western European Summer Time)',
                  _room: 'R1',
                  _campus: 'Alameda'
                },
                {
                  _start: 'Wed Sep 09 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                  _end: 'Wed Sep 09 2020 11:00:00 GMT+0100 (Western European Summer Time)',
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
                  _end: 'Tue Sep 08 2020 11:00:00 GMT+0100 (Western European Summer Time)',
                  _room: 'R2',
                  _campus: 'Alameda'
                }
              ],
              _campus: 'Alameda'
            }
          ],
          _courseLoads: { Teórica: 3, Laboratorial: 1.5 }
        }
      ],
      academicTerm: '2020/2021',
      degreeID: 1
    };
    window.history.pushState(data, '', '');

    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ],
      declarations: [ SchedulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulesComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have data received', () => {
    expect(data).toBeTruthy();
  });

  it('should return to homepage if no data', () => { // TODO
    // window.history.state.pop();
    // const router = TestBed.createComponent(Router);
  });

  describe('Parsing received data', () => {

    it('should parse data correctly', () => {
      const receivedCourses = parseCourses(data.selectedCourses);
      for (let i = 0; i < receivedCourses.length ; i++) {
        const d = data.selectedCourses[i];
        const course = receivedCourses[i];

        expect(course.id).toEqual(d._id);
        expect(course.name).toEqual(d._name);
        expect(course.acronym).toEqual(d._acronym);
        expect(course.types).toEqual(d._types);
        expect(course.campus).toEqual(d._campus);
        expect(course.courseLoads).toEqual(d._courseLoads);

        for (let j = 0; j < course.shifts.length ; j++) {
          const shift = course.shifts[j];
          for (let k = 0; k < shift.lessons.length; k++) {
            const lesson = shift.lessons[k];
            const start = d._shifts[j]._lessons[k]._start;
            const end = d._shifts[j]._lessons[k]._end;
            const room = d._shifts[j]._lessons[k]._room;
            const campus = d._shifts[j]._lessons[k]._campus;

            expect(lesson.start).toEqual(new Date(start));
            expect(lesson.end).toEqual(new Date(end));
            expect(lesson.room).toEqual(room);
            expect(lesson.campus).toEqual(campus);
          }
        }
      }
    });

  });

});
