import { TestBed } from '@angular/core/testing';

import { SchedulesGenerationService } from './schedules-generation.service';

import {Course} from '../../_domain/Course/Course';
import {ClassType} from '../../_domain/ClassType/ClassType';
import {Shift} from '../../_domain/Shift/Shift';
import {Lesson} from '../../_domain/Lesson/Lesson';
import {Class} from '../../_domain/Class/Class';
import {Schedule} from '../../_domain/Schedule/Schedule';

import {formatTime, getTimestamp} from '../../_util/Time';

describe('SchedulesGenerationService', () => {
  let service: SchedulesGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchedulesGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  describe('Generating schedules', () => {

    beforeEach(() => {
      spyOn(service, 'getBrowserSupportForWorkers').and.returnValue(false);
    });

    describe('Getting all combinations in an array', () => {
      const parameters = [
        {
          description: 'should get all combinations: array = [ [[1, 4], [2, 4]], [5, 6] ]',
          input: [ [[1, 4], [2, 4]], [5, 6] ],
          result: [ [1, 4, 5], [2, 4, 5], [1, 4, 6], [2, 4, 6] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [4], [5, 6] ]',
          input: [ [1, 2, 3], [4], [5, 6] ],
          result: [ [1, 4, 5], [2, 4, 5], [3, 4, 5], [1, 4, 6], [2, 4, 6], [3, 4, 6] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [4, 5] ]',
          input: [ [1, 2, 3], [4, 5] ],
          result: [ [1, 4], [2, 4], [3, 4], [1, 5], [2, 5], [3, 5] ]
        },
        {
          description: 'should get all combinations: array = [ [1, 2, 3], [4] ]',
          input: [ [1, 2, 3], [4] ],
          result: [ [1, 4], [2, 4], [3, 4] ]
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
          description: 'should get all combinations: array = [ [1, 2, 3], [] ]',
          input: [ [1, 2, 3], [] ],
          result: [ [1], [2], [3] ]
        },
        {
          description: 'should get all combinations: array = [ [1] ]',
          input: [ [1] ],
          result: [ [1] ]
        },
        {
          description: 'should get all combinations: array = [ [], [1, 2] ]',
          input: [ [], [1, 2] ],
          result: [ [1], [2] ]
        },
        {
          description: 'should get all combinations: array = [ [], [] ]',
          input: [ [], [] ],
          result: []
        },
        {
          description: 'should get all combinations: array = [ [] ]',
          input: [ [] ],
          result: []
        }
      ];

      parameters.forEach((parameter) => {
        it(parameter.description, () => {
          expect(service.allPossibleCases(parameter.input)).toEqual(parameter.result);
        });
      });
    });

    describe('Combining shifts', () => {

      let course: Course;

      beforeEach(() => {
        course = new Course(
          1, 'Course #1', 'C1', 4.5,  1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
            ], 'Alameda')
          ], { TEORICA: 1.5, LABORATORIAL: 1.5 });
      });

      it('should combine shifts correctly: different types of classes', () => {
        const t1 = course.shifts[0];
        const t2 = course.shifts[1];
        const lab = course.shifts[2];

        const classes = service.combineShifts(course);

        expect(classes.length).toBe(2);
        expect(classes[0].shifts).not.toEqual(classes[1].shifts);

        let t1Included = false;

        classes.forEach(cl => {
          expect(cl.course).toEqual(course);
          expect(cl.shifts.length).toBe(2);
          expect(cl.shifts.includes(lab)).toBeTrue();
          if (t1Included) {
            expect(cl.shifts.includes(t2)).toBeTrue();
          } else {
            expect(cl.shifts.includes(t1)).toBeTrue();
            t1Included = true;
          }

          cl.shifts.forEach(shift => {
            const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
            let totalHours = 0;
            shift.lessons.forEach(lesson => {
              totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
            });
            expect(totalHours).toBe(1.5);
          });
        });
      });

      it('should combine shifts correctly: same type of class', () => {
        course.types = [ClassType.THEORY_PT];
        course.shifts = [
          new Shift('T01', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('T02', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('T03', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 12:30'), new Date('2020-09-07 14:00'), 'R1', 'Alameda')
          ], 'Alameda')
        ];
        course.courseLoads = { TEORICA: 1.5 };

        const t1 = course.shifts[0];
        const t2 = course.shifts[1];
        const t3 = course.shifts[2];

        const classes = service.combineShifts(course);

        expect(classes.length).toBe(3);
        expect(classes[0].shifts).not.toEqual(classes[1].shifts);
        expect(classes[0].shifts).not.toEqual(classes[2].shifts);
        expect(classes[1].shifts).not.toEqual(classes[2].shifts);

        classes.forEach(cl => {
          expect(cl.course).toEqual(course);
          expect(cl.shifts.length).toBe(1);
          expect(cl.shifts.includes(t1) || cl.shifts.includes(t2) || cl.shifts.includes(t3)).toBeTrue();

          cl.shifts.forEach(shift => {
            const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
            let totalHours = 0;
            shift.lessons.forEach(lesson => {
              totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
            });
            expect(totalHours).toBe(1.5);
          });
        });
      });

      it('should combine shifts correctly: only 2 shifts', () => {
        course.shifts.splice(1, 1);
        const t1 = course.shifts[0];
        const lab = course.shifts[1];

        const classes = service.combineShifts(course);

        expect(classes.length).toBe(1);
        expect(classes[0].course).toEqual(course);
        expect(classes[0].shifts.length).toBe(2);
        expect(classes[0].shifts.includes(t1)).toBeTrue();
        expect(classes[0].shifts.includes(lab)).toBeTrue();
        classes[0].shifts.forEach(shift => {
          const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
          let totalHours = 0;
          shift.lessons.forEach(lesson => {
            totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
          });
          expect(totalHours).toBe(1.5);
        });
      });


      it('should combine shifts correctly: shifts overlap', () => {
        course.shifts = [
          new Shift('T01', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('T02', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('L01', ClassType.LAB_PT, [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
          ], 'Alameda'),
          new Shift('L02', ClassType.LAB_PT, [
            new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R2', 'Alameda')
          ], 'Alameda')
        ];

        const t1 = course.shifts[0];
        const t2 = course.shifts[1];
        const lab1 = course.shifts[2];
        const lab2 = course.shifts[3];

        const classes = service.combineShifts(course);

        expect(classes.length).toBe(2);
        expect(classes[0].shifts).not.toEqual(classes[1].shifts);

        classes.forEach(cl => {
          expect(cl.course).toEqual(course);
          expect(cl.shifts.length).toBe(2);
          expect(cl.shifts.includes(t1) || cl.shifts.includes(t2)).toBeTrue();
          if (cl.shifts.includes(t1)) expect(cl.shifts.includes(lab2)).toBeTrue();
          else if (cl.shifts.includes(t2)) expect(cl.shifts.includes(lab1)).toBeTrue();

          cl.shifts.forEach(shift => {
            const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
            let totalHours = 0;
            shift.lessons.forEach(lesson => {
              totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
            });
            expect(totalHours).toBe(1.5);
          });

          cl.shifts.forEach(shift => {
            const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
            let totalHours = 0;
            shift.lessons.forEach(lesson => {
              totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
            });
            expect(totalHours).toBe(1.5);
          });
        });
      });

      it('should combine shifts correctly: only one shift', () => {
        course.types = [ClassType.THEORY_PT];
        course.shifts.splice(1, 2);
        course.courseLoads = { TEORICA: 1.5 };

        const classes = service.combineShifts(course);

        expect(classes.length).toBe(1);
        expect(classes[0].course).toEqual(course);
        expect(classes[0].shifts).toEqual(course.shifts);
        classes[0].shifts.forEach(shift => {
          const MILLISECONDS_IN_AN_HOUR = 60 * 60 * 1000;
          let totalHours = 0;
          shift.lessons.forEach(lesson => {
            totalHours += Math.abs(lesson.end.getTime() - lesson.start.getTime()) / MILLISECONDS_IN_AN_HOUR;
          });
          expect(totalHours).toBe(1.5);
        });
      });

      it('should combine shifts correctly: no shifts', () => {
        course.shifts = [];
        const classes = service.combineShifts(course);
        expect((classes).length).toBe(0);
      });

    });

    describe('Combining classes', () => {

      let courses: Course[];

      beforeEach(() => {
        courses = [
          new Course(
            1, 'Course #1', 'C1', 4.5,  1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
            [
              new Shift('T01', ClassType.THEORY_PT, [
                new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
              ], 'Alameda'),
              new Shift('T02', ClassType.THEORY_PT, [
                new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
              ], 'Alameda'),
              new Shift('L01', ClassType.LAB_PT, [
                new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
              ], 'Alameda')
            ], { TEORICA: 1.5, LABORATORIAL: 1.5 }),
          new Course(
            2, 'Course #2', 'C2', 4.5, 1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Taguspark'],
            [
              new Shift('T01', ClassType.THEORY_PT, [
                new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
              ], 'Taguspark'),
              new Shift('T02', ClassType.THEORY_PT, [
                new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark')
              ], 'Taguspark')
            ], { TEORICA: 1.5 })
        ];
      });

      it('should combine classes correctly', async () => {
        const classesPerCourse: Class[][] = [];
        courses.forEach(course => {
          classesPerCourse.push(service.combineShifts(course));
        });

        const c1Class1 = classesPerCourse[0][0];
        const c1Class2 = classesPerCourse[0][1];
        const c2Class1 = classesPerCourse[1][0];
        const c2Class2 = classesPerCourse[1][1];

        const combinations = await service.combineClasses(classesPerCourse);
        expect(combinations.length).toBe(4);

        combinations.forEach(combination => {
          expect(
            ( combination.includes(c1Class1) && combination.includes(c2Class1) ) ||
            ( combination.includes(c1Class1) && combination.includes(c2Class2) ) ||
            ( combination.includes(c1Class2) && combination.includes(c2Class1) ) ||
            ( combination.includes(c1Class2) && combination.includes(c2Class2) )
          ).toBeTrue();
        });
      });

      it('should combine classes correctly: only one course', async () => {
        courses.splice(1, 1);

        const classes = service.combineShifts(courses[0]);

        const class1 = classes[0];
        const class2 = classes[1];

        const combinations = await service.combineClasses([classes]);
        expect(combinations.length).toBe(2);

        combinations.forEach(combination => {
          expect(combination.includes(class1) || combination.includes(class2)).toBeTrue();
        });
      });

      it('should combine classes correctly: classes overlap', async () => {
        courses[1].shifts[1] = new Shift('T02', ClassType.THEORY_PT, [
          new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Taguspark')
        ], 'Taguspark');

        const classesPerCourse: Class[][] = [];
        courses.forEach(course => {
          classesPerCourse.push(service.combineShifts(course));
        });

        const c1Class1 = classesPerCourse[0][0];
        const c1Class2 = classesPerCourse[0][1];
        const c2Class1 = classesPerCourse[1][0];
        const c2Class2 = classesPerCourse[1][1];

        const combinations = await service.combineClasses(classesPerCourse);
        expect(combinations.length).toBe(3);

        combinations.forEach(combination => {
          expect(
            ( combination.includes(c1Class1) && combination.includes(c2Class1) ) ||
            ( combination.includes(c1Class2) && combination.includes(c2Class1) ) ||
            ( combination.includes(c1Class2) && combination.includes(c2Class2) )
          ).toBeTrue();
          expect(combination.includes(c1Class1) && combination.includes(c2Class2)).toBeFalse();
        });
      });

      it('should combine classes correctly: empty class', async () => {
        const combinations = await service.combineClasses([ [] ]);
        expect(combinations.length).toBe(0);
      });

      it('should combine classes correctly: multiple empty classes', async () => {
        const combinations = await service.combineClasses([ [], [] ]);
        expect(combinations.length).toBe(0);
      });

      it('should combine classes correctly: empty class & non-empty classes', async () => {
        const classesPerCourse: Class[][] = [];
        classesPerCourse.push(service.combineShifts(courses[0]));
        classesPerCourse.push([]);

        const combinations = await service.combineClasses(classesPerCourse);
        expect(combinations.length).toBe(0);
      });

      it('should combine classes correctly: no classes', async () => {
        const combinations = await service.combineClasses([ ]);
        expect(combinations.length).toBe(0);
      });

      it('should combine classes correctly: incompatible classes', async () => {
        courses.push(new Course(
          3, 'Course #3', 'C3', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 10:00'), new Date('2020-09-09 11:30'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 10:00'), new Date('2020-09-09 11:30'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { TEORICA: 1.5 }),
          new Course(
            4, 'Course #4', 'C4', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Taguspark'],
            [
              new Shift('T01', ClassType.THEORY_PT, [
                new Lesson(new Date('2020-09-10 10:00'), new Date('2020-09-10 11:30'), 'R3', 'Taguspark')
              ], 'Taguspark')
            ], { TEORICA: 1.5 }));

        const combinations = await service.generateSchedules(courses);
        expect(combinations.length).toBe(0);
      });

    });

    describe('Calculate schedule info', () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', 4.5, 1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('L01', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-07 12:00'), new Date('2020-09-07 13:30'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R1', 'Alameda')
            ], 'Alameda')
          ], { TEORICA: 1.5, LABORATORIAL: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { TEORICA: 1.5 }),
        new Course(
          3, 'Course #3', 'C3', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Alameda'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark'),
              new Lesson(new Date('2020-09-09 15:00'), new Date('2020-09-09 20:00'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { TEORICA: 1.5 })
      ];

      let schedule: Schedule;

      beforeEach(() => {
        schedule = new Schedule(0, [
          new Class(courses[0], courses[0].shifts),
          new Class(courses[1], courses[1].shifts),
          new Class(courses[2], courses[2].shifts),
        ]);
      });

      it('should prepare schedule data correctly', () => {
        const data = service.prepareData(1, schedule.classes);
        const allLessons = data.allLessons;
        const classesPerWeekday = data.classesPerWeekday;
        const events = data.events;

        // Check lessons
        const lessons: Lesson[] = [];
        for (const cl of schedule.classes)
          for (const shift of cl.shifts)
            for (const lesson of shift.lessons)
              lessons.push(lesson);
        expect(allLessons).toEqual(lessons);

        // Check classes per weekday
        expect(classesPerWeekday.size).toBe(3);

        expect(classesPerWeekday.has(1)).toBeTrue();
        let weekday = classesPerWeekday.get(1);
        expect(weekday.length).toBe(2);
        let course = courses[0];
        expect(weekday.includes({
          start: getTimestamp(formatTime(course.shifts[0].lessons[0].start)),
          end: getTimestamp(formatTime(course.shifts[0].lessons[0].end))
        }));
        expect(weekday.includes({
          start: getTimestamp(formatTime(course.shifts[1].lessons[0].start)),
          end: getTimestamp(formatTime(courses[0].shifts[1].lessons[0].end))
        }));
        expect(weekday[0].start < weekday[1].start).toBeTrue();

        expect(classesPerWeekday.has(2)).toBeTrue();
        weekday = classesPerWeekday.get(2);
        expect(weekday.length).toBe(1);
        expect(weekday.includes({
          start: getTimestamp(formatTime(course.shifts[1].lessons[1].start)),
          end: getTimestamp(formatTime(course.shifts[1].lessons[1].end))
        }));

        expect(classesPerWeekday.has(3)).toBeTrue();
        weekday = classesPerWeekday.get(3);
        expect(weekday.length).toBe(3);
        course = courses[1];
        expect(weekday.includes({
          start: getTimestamp(formatTime(course.shifts[0].lessons[0].start)),
          end: getTimestamp(formatTime(course.shifts[0].lessons[0].end))
        }));
        course = courses[2];
        expect(weekday.includes({
          start: getTimestamp(formatTime(course.shifts[0].lessons[0].start)),
          end: getTimestamp(formatTime(course.shifts[0].lessons[0].end))
        }));
        expect(weekday.includes({
          start: getTimestamp(formatTime(course.shifts[0].lessons[1].start)),
          end: getTimestamp(formatTime(course.shifts[0].lessons[1].end))
        }));
        expect(weekday[0].start < weekday[1].start && weekday[1].start < weekday[2].start).toBeTrue();

        // Check events
        expect(events.length).toBe(6);
      });

      it('should calculate proximity level for a schedule correctly', () => {
        const lessons: Lesson[] = [];
        for (const cl of schedule.classes) {
          for (const shift of cl.shifts)
            for (const lesson of shift.lessons)
              lessons.push(lesson);
        }
        const proximity = service.calculateProximityLevel(schedule, lessons);
        expect(proximity).toBe(2207);
      });

      it('should calculate schedule info correctly', async () => {
        const combinations = await service.combineClasses([[schedule.classes[0]], [schedule.classes[1]], [schedule.classes[2]]]);
        service.calculateSchedulesInfo(combinations);
        const info = service.generatedSchedulesInfo.get(schedule.id);

        expect(info.proximity).toBe(2207);
        expect(info.nr_holes).toBe(2);
        expect(info.total_duration).toBe(210);
        expect(info.total_deviation).toBe(420);
        expect(info.nr_free_days).toBe(2);
        expect(info.events.length).toEqual(6);
      });

      it('should count holes for a schedule correctly', () => {
        const classesPerWeekday = service.prepareData(1, schedule.classes).classesPerWeekday;
        const holesInfo = service.countHoles(classesPerWeekday);

        expect(holesInfo.nr_holes).toBe(2);
        expect(holesInfo.total_duration).toBe(210);
      });

      it('should calculate deviation for a schedule correctly', () => {
        // TODO
      });

      it('should calculate number of free days correctly', () => {
        const classesPerWeekday = service.prepareData(1, schedule.classes).classesPerWeekday;
        const freeDays = service.calculateNumberFreeDays(classesPerWeekday);

        expect(freeDays).toBe(2);
      });
    });

    describe('Sort by most compact', () => {
      // TODO
    });

    describe('Sort by most balanced', () => {
      // TODO
    });

    describe('Sort by most free days', () => {
      // TODO
    });

    it('should generate schedules successfully: no overlaps', async () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', 4.5, 1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T03', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 12:30'), new Date('2020-09-07 14:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'R2', 'Alameda')
            ], 'Alameda')
          ], { TEORICA: 1.5, LABORATORIAL: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T03', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 12:30'), new Date('2020-09-09 14:00'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { TEORICA: 1.5 })
      ];

      const schedules = await service.generateSchedules(courses);
      expect(schedules.length).toBe(6 * 3);
    });

    it('should generate schedules successfully: with overlaps', async () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', 4.5, 1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T03', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 12:30'), new Date('2020-09-07 14:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'R2', 'Alameda')
            ], 'Alameda')
          ], { TEORICA: 1.5, LABORATORIAL: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-09 11:00'), new Date('2020-09-09 12:30'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T03', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark')
          ], { TEORICA: 1.5 })
      ];

      const schedules = await service.generateSchedules(courses);
      expect(schedules.length).toBe(6 * 3 - 2);
    });

    it('should generate schedules successfully: they all overlap', async () => {
      const courses = [
        new Course(
          1, 'Course #1', 'C1', 4.5, 1, 'P1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('T03', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Alameda')
            ], 'Alameda'),
            new Shift('L01', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'R4', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'R4', 'Alameda')
            ], 'Alameda')
          ], { TEORICA: 1.5, LABORATORIAL: 1.5 }),
        new Course(
          2, 'Course #2', 'C2', 4.5, 1, 'P1', [ClassType.THEORY_PT], ['Taguspark'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R3', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R4', 'Taguspark')
            ], 'Taguspark'),
            new Shift('T03', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R5', 'Taguspark')
            ], 'Taguspark')
          ], { TEORICA: 1.5 })
      ];

      const schedules = await service.generateSchedules(courses);
      expect(schedules.length).toBe(0);
    });

    it('should generate schedules successfully: sorted by most compact', () => {
      // TODO
    });
  });

});
