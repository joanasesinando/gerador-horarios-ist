import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';

import {SchedulesComponent} from './schedules.component';

import {RouterTestingModule} from '@angular/router/testing';

import {ClassType} from '../_domain/ClassType';
import {Course} from '../_domain/Course';
import {Shift} from '../_domain/Shift';
import {Lesson} from '../_domain/Lesson';
import {Class} from '../_domain/Class';

describe('SchedulesComponent', () => {
  let component: SchedulesComponent;
  let fixture: ComponentFixture<SchedulesComponent>;
  let de: DebugElement;

  let data: {_id, _name, _acronym, _types, _campus, _shifts, _courseLoads}[];

  beforeEach(async(() => {
    data = [
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
    ];
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
      const receivedCourses = component.parseCourses(data);
      for (let i = 0; i < receivedCourses.length ; i++) {
        const d = data[i];
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

  describe('Generating schedules', () => {

    describe('Getting all combinations in an array', () => {
      const parameters = [
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [4], [5, 6] ]',
          input: [ [1, 2, 3], [4], [5, 6] ],
          result: [ [1, 4, 5], [2, 4, 5], [3, 4, 5], [1, 4, 6], [2, 4, 6], [3, 4, 6] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [4] ]',
          input: [ [1, 2, 3], [4] ],
          result: [ [1, 4], [2, 4], [3, 4] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [] ]',
          input: [ [1, 2, 3], [] ],
          result: [ [1], [2], [3] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [], [4] ]',
          input: [ [1, 2, 3], [], [4] ],
          result: [ [1, 4], [2, 4], [3, 4] ]
        },
        {
          description: 'should get all combinations: array = [ [1], [2, 3, 4] ]',
          input: [ [1], [2, 3, 4] ],
          result: [ [1, 2], [1, 3], [1, 4] ]
        },
        {
          description: 'should get all combinations: array = [ [1], [2], [3] ]',
          input: [ [1], [2], [3] ],
          result: [ [1, 2, 3] ]
        },
        {
          description: 'should get all combinations: array = [ [1], [2] ]',
          input: [ [1], [2] ],
          result: [ [1, 2] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3] ]',
          input: [ [1, 2, 3] ],
          result: [ [1], [2], [3] ]
        },
        {
          description: 'should get all combinations: array = [ [1] ]',
          input: [ [1] ],
          result: [ [1] ]
        },
        {
          description: 'should get all combinations: array = [ [] ]',
          input: [ [] ],
          result: []
        }
      ];

      parameters.forEach((parameter) => {
        it(parameter.description, () => {
          expect(component.allPossibleCases(parameter.input)).toEqual(parameter.result);
        });
      });
    });

    describe('Combining shifts', () => {

      let course: Course;

      beforeEach(() => {
        course = new Course(
          1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
            ], 'Alameda')
          ], { Teórica: 1.5, Laboratorial: 1.5 });
      });

      it('should combine shifts correctly: different types of classes', () => {
        const t1 = course.shifts[0];
        const t2 = course.shifts[1];
        const lab = course.shifts[2];

        const classes = component.combineShifts(course);

        expect(classes.length).toBe(2);
        expect(classes[0].shifts === classes[1].shifts).toBeFalse();

        classes.forEach(cl => {
          expect(cl.course).toEqual(course);
          expect(cl.shifts.length).toBe(2);
          expect(cl.shifts.includes(lab)).toBeTrue();
          expect(cl.shifts.includes(t1) || cl.shifts.includes(t2)).toBeTrue();
        });
      });

      it('should combine shifts correctly: same type of class', () => {
        course.types = [ClassType.THEORY_PT];
        course.shifts = [
          new Shift('T01', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('T02', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('T03', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 12:30'), new Date('2020-09-07 14:00'), 'R1', 'Alameda')
          ], 'Alameda')
        ];
        course.courseLoads = { Teórica: 1.5 };

        const t1 = course.shifts[0];
        const t2 = course.shifts[1];
        const t3 = course.shifts[2];

        const classes = component.combineShifts(course);

        expect(classes.length).toBe(3);
        expect(classes[0].shifts === classes[1].shifts).toBeFalse();
        expect(classes[0].shifts === classes[2].shifts).toBeFalse();
        expect(classes[1].shifts === classes[2].shifts).toBeFalse();

        classes.forEach(cl => {
          expect(cl.course).toEqual(course);
          expect(cl.shifts.length).toBe(1);
          expect(cl.shifts.includes(t1) || cl.shifts.includes(t2) || cl.shifts.includes(t3)).toBeTrue();
        });
      });

      it('should combine shifts correctly: only 2 shifts', () => {
        course.shifts.splice(1, 1);
        const t1 = course.shifts[0];
        const lab = course.shifts[1];

        const classes = component.combineShifts(course);

        expect(classes.length).toBe(1);
        expect(classes[0].course).toEqual(course);
        expect(classes[0].shifts.length).toBe(2);
        expect(classes[0].shifts.includes(t1)).toBeTrue();
        expect(classes[0].shifts.includes(lab)).toBeTrue();
      });


      it('should combine shifts correctly: shifts overlap', () => {
        course.shifts = [
          new Shift('T01', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('T02', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('L01', [ClassType.LAB_PT], [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
          ], 'Alameda'),
          new Shift('L02', [ClassType.LAB_PT], [
            new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R2', 'Alameda')
          ], 'Alameda')
        ];

        const t1 = course.shifts[0];
        const t2 = course.shifts[1];
        const lab1 = course.shifts[2];
        const lab2 = course.shifts[3];

        const classes = component.combineShifts(course);

        expect(classes.length).toBe(2);
        expect(classes[0].shifts === classes[1].shifts).toBeFalse();

        classes.forEach(cl => {
          expect(cl.course).toEqual(course);
          expect(cl.shifts.length).toBe(2);
          expect(cl.shifts.includes(t1) || cl.shifts.includes(t2)).toBeTrue();
          if (cl.shifts.includes(t1)) { expect(cl.shifts.includes(lab2)).toBeTrue(); }
          else if (cl.shifts.includes(t2)){ expect(cl.shifts.includes(lab1)).toBeTrue(); }
        });
      });

      it('should combine shifts correctly: only one shift', () => {
        course.types = [ClassType.THEORY_PT];
        course.shifts.splice(1, 2);
        course.courseLoads = { Teórica: 1.5 };

        const classes = component.combineShifts(course);

        expect(classes.length).toBe(1);
        expect(classes[0].course).toEqual(course);
        expect(classes[0].shifts).toEqual(course.shifts);
      });

      it('should combine shifts correctly: no shifts', () => {
        course.shifts = [];
        const classes = component.combineShifts(course);
        expect((classes).length).toBe(0);
      });

    });

    describe('Combining classes', () => {

      let courses: Course[];

      beforeEach(() => {
        courses = [
          new Course(
            1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
            [
              new Shift('T01', [ClassType.THEORY_PT], [
                new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
              ], 'Alameda'),
              new Shift('T02', [ClassType.THEORY_PT], [
                new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
              ], 'Alameda'),
              new Shift('L01', [ClassType.LAB_PT], [
                new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
              ], 'Alameda')
            ], { Teórica: 1.5, Laboratorial: 1.5 }),
          new Course(
            2, 'Course #2', 'C2', [ClassType.THEORY_PT], ['Taguspark'],
            [
              new Shift('T01', [ClassType.THEORY_PT], [
                new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
              ], 'Taguspark'),
              new Shift('T02', [ClassType.THEORY_PT], [
                new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark')
              ], 'Taguspark')
            ], { Teórica: 1.5 })
        ];
      });

      it('should combine classes correctly', () => {
        const classesPerCourse: Class[][] = [];
        courses.forEach(course => {
          classesPerCourse.push(component.combineShifts(course));
        });

        const c1Class1 = classesPerCourse[0][0];
        const c1Class2 = classesPerCourse[0][1];
        const c2Class1 = classesPerCourse[1][0];
        const c2Class2 = classesPerCourse[1][1];

        const schedules = component.combineClasses(classesPerCourse);
        expect(schedules.length).toBe(4);

        schedules.forEach(schedule => {
          expect(
            ( schedule.classes.includes(c1Class1) && schedule.classes.includes(c2Class1) ) ||
            ( schedule.classes.includes(c1Class1) && schedule.classes.includes(c2Class2) ) ||
            ( schedule.classes.includes(c1Class2) && schedule.classes.includes(c2Class1) ) ||
            ( schedule.classes.includes(c1Class2) && schedule.classes.includes(c2Class2) )
          ).toBeTrue();
        });
      });

      it('should combine classes correctly: only one course', () => {
        courses.splice(1, 1);

        const classes = component.combineShifts(courses[0]);

        const class1 = classes[0];
        const class2 = classes[1];

        const schedules = component.combineClasses([classes]);
        expect(schedules.length).toBe(2);

        schedules.forEach(schedule => {
          expect(schedule.classes.includes(class1) || schedule.classes.includes(class2)).toBeTrue();
        });
      });

      it('should combine classes correctly: classes overlap', () => {
        courses[1].shifts[1] = new Shift('T02', [ClassType.THEORY_PT], [
          new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Taguspark')
        ], 'Taguspark');

        const classesPerCourse: Class[][] = [];
        courses.forEach(course => {
          classesPerCourse.push(component.combineShifts(course));
        });

        const c1Class1 = classesPerCourse[0][0];
        const c1Class2 = classesPerCourse[0][1];
        const c2Class1 = classesPerCourse[1][0];
        const c2Class2 = classesPerCourse[1][1];

        const schedules = component.combineClasses(classesPerCourse);
        expect(schedules.length).toBe(3);

        schedules.forEach(schedule => {
          expect(
            ( schedule.classes.includes(c1Class1) && schedule.classes.includes(c2Class1) ) ||
            ( schedule.classes.includes(c1Class2) && schedule.classes.includes(c2Class1) ) ||
            ( schedule.classes.includes(c1Class2) && schedule.classes.includes(c2Class2) )
          ).toBeTrue();
          expect(schedule.classes.includes(c1Class1) && schedule.classes.includes(c2Class2)).toBeFalse();
        });
      });

      it('should combine classes correctly: empty class', () => {
        const schedules = component.combineClasses([ [] ]);
        expect(schedules.length).toBe(0);
      });

      it('should combine classes correctly: multiple empty classes', () => {
        const schedules = component.combineClasses([ [], [] ]);
        expect(schedules.length).toBe(0);
      });

      it('should combine classes correctly: empty class & non-empty classes', () => {
        const classesPerCourse: Class[][] = [];
        classesPerCourse.push(component.combineShifts(courses[0]));
        classesPerCourse.push([]);

        const schedules = component.combineClasses(classesPerCourse);
        expect(schedules.length).toBe(2);
      });

      it('should combine classes correctly: no classes', () => {
        const schedules = component.combineClasses([ ]);
        expect(schedules.length).toBe(0);
      });

    });

    it('should generate schedules successfully: no overlaps', () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T03', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 12:30'), new Date('2020-09-07 14:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'R2', 'Alameda')
            ], 'Alameda')
          ], { Teórica: 1.5, Laboratorial: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T03', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-09 12:30'), new Date('2020-09-09 14:00'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { Teórica: 1.5 })
      ];

      component.selectedCourses = courses;
      const schedules = component.generateSchedules();
      expect(schedules.length).toBe(6 * 3);
    });

    it('should generate schedules successfully: with overlaps', () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T03', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 12:30'), new Date('2020-09-07 14:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'R2', 'Alameda')
            ], 'Alameda')
          ], { Teórica: 1.5, Laboratorial: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T03', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { Teórica: 1.5 })
      ];

      component.selectedCourses = courses;
      const schedules = component.generateSchedules();
      expect(schedules.length).toBe(6 * 3 - 2);
    });

    it('should generate schedules successfully: they all overlap', () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('T03', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R4', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', [ClassType.LAB_PT], [
              new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'R4', 'Alameda')
            ], 'Alameda')
          ], { Teórica: 1.5, Laboratorial: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R4', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T03', [ClassType.THEORY_PT], [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R5', 'Taguspark')
            ], 'Taguspark')
          ], { Teórica: 1.5 })
      ];

      component.selectedCourses = courses;
      const schedules = component.generateSchedules();
      expect(schedules.length).toBe(0);
    });
  });
});
