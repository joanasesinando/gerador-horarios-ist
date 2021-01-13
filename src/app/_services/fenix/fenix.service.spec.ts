import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {FenixService} from './fenix.service';
import {TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {TestingService} from '../../_util/testing.service';

import {Course} from '../../_domain/Course/Course';
import {ClassType} from '../../_domain/ClassType/ClassType';
import {Shift} from '../../_domain/Shift/Shift';
import {Lesson} from '../../_domain/Lesson/Lesson';
import {Degree} from '../../_domain/Degree/Degree';


describe('FenixService', () => {
  let service: FenixService;
  let translation: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        })
      ],
      providers: [TranslateService]
    });
    service = TestBed.inject(FenixService);
    translation = TestBed.inject(TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Correct structure', () => {
    it('should parse a degree correctly', () => {
      const degree = service.parseDegree({id: 123, name: 'Degree Name', acronym: 'DG01'});
      expect(degree).toBeTruthy();
      expect(degree.id).toBe(123);
      expect(degree.name).toBe('Degree Name');
      expect(degree.acronym).toBe('DG01');
    });

    describe('Invalid degree parsing', () => {
      const parameters = [
        {
          description: 'should parse a degree: no ID',
          input: {name: 'Degree Name', acronym: 'DG01'},
          error: new Error('No ID found for degree')
        },
        {
          description: 'should parse a degree: null ID',
          input: {id: null, name: 'Degree Name', acronym: 'DG01'},
          error: new Error('No ID found for degree')
        },
        {
          description: 'should parse a degree: zero ID',
          input: {id: 0, name: 'Degree Name', acronym: 'DG01'},
          error: new Error('No ID found for degree')
        },
        {
          description: 'should parse a degree: no name',
          input: {id: 123, acronym: 'DG01'},
          error: new Error('No name found for degree 123')
        },
        {
          description: 'should parse a degree: null name',
          input: {id: 123, name: null, acronym: 'DG01'},
          error: new Error('No name found for degree 123')
        },
        {
          description: 'should parse a degree: empty name',
          input: {id: 123, name: '', acronym: 'DG01'},
          error: new Error('No name found for degree 123')
        },
        {
          description: 'should parse a degree: no acronym',
          input: {id: 123, name: 'Degree Name'},
          error: new Error('No acronym found for degree 123')
        },
        {
          description: 'should parse a degree: null acronym',
          input: {id: 123, name: 'Degree Name', acronym: null},
          error: new Error('No acronym found for degree 123')
        },
        {
          description: 'should parse a degree: empty acronym',
          input: {id: 123, name: 'Degree Name', acronym: ''},
          error: new Error('No acronym found for degree 123')
        },
      ];

      parameters.forEach(parameter => {
        it(parameter.description, () => {
          expect(() => service.parseDegree(parameter.input)).toThrow(parameter.error);
        });
      });
    });

    it('should parse course basic info correctly', () => {
      const course = service.parseCourseBasicInfo({id: 123, name: 'Course Name', acronym: 'CS01'});
      expect(course).toBeTruthy();
      expect(course.id).toBe(123);
      expect(course.name).toBe('Course Name');
      expect(course.acronym).toBe('CS01');
    });

    describe('Invalid course basic info parsing', () => {
      const parameters = [
        {
          description: 'should parse course basic info: no ID',
          input: {name: 'Course Name', acronym: 'CS01'},
          error: new Error('No ID found for course')
        },
        {
          description: 'should parse course basic info: null ID',
          input: {id: null, name: 'Course Name', acronym: 'CS01'},
          error: new Error('No ID found for course')
        },
        {
          description: 'should parse course basic info: zero ID',
          input: {id: 0, name: 'Course Name', acronym: 'CS01'},
          error: new Error('No ID found for course')
        },
        {
          description: 'should parse course basic info: no name',
          input: {id: 123, acronym: 'CS01'},
          error: new Error('No name found for course 123')
        },
        {
          description: 'should parse course basic info: null name',
          input: {id: 123, name: null, acronym: 'CS01'},
          error: new Error('No name found for course 123')
        },
        {
          description: 'should parse course basic info: empty name',
          input: {id: 123, name: '', acronym: 'CS01'},
          error: new Error('No name found for course 123')
        },
        {
          description: 'should parse course basic info: no acronym',
          input: {id: 123, name: 'Course Name'},
          error: new Error('No acronym found for course 123')
        },
        {
          description: 'should parse course basic info: null acronym',
          input: {id: 123, name: 'Course Name', acronym: null},
          error: new Error('No acronym found for course 123')
        },
        {
          description: 'should parse course basic info: empty acronym',
          input: {id: 123, name: 'Course Name', acronym: ''},
          error: new Error('No acronym found for course 123')
        },
      ];

      parameters.forEach(parameter => {
        it(parameter.description, () => {
          expect(() => service.parseCourseBasicInfo(parameter.input)).toThrow(parameter.error);
        });
      });
    });

    describe('Catching course missing important info', () => {
      const parameters = [
        {
          description: 'should catch no course loads',
          input: {shifts: undefined},
          error: new Error('No courseLoads found')
        },
        {
          description: 'should catch null course loads',
          input: {courseLoads: null, shifts: undefined},
          error: new Error('No courseLoads found')
        },
        {
          description: 'should catch empty course loads',
          input: {courseLoads: [], shifts: undefined},
          error: new Error('No courseLoads found')
        },
        {
          description: 'should catch no type in course loads',
          input: {courseLoads: [{unitQuantity: 0}], shifts: undefined},
          error: new Error('No type found in courseLoads')
        },
        {
          description: 'should catch null type in course loads',
          input: {courseLoads: [{type: null, unitQuantity: 0}], shifts: undefined},
          error: new Error('No type found in courseLoads')
        },
        {
          description: 'should catch no unitQuantity in course loads',
          input: {courseLoads: [{type: ''}], shifts: undefined},
          error: new Error('No unitQuantity found in courseLoads')
        },
        {
          description: 'should catch null unitQuantity in course loads',
          input: {courseLoads: [{type: '', unitQuantity: null}], shifts: undefined},
          error: new Error('No unitQuantity found in courseLoads')
        },
        {
          description: 'should catch no shifts',
          input: {courseLoads: [{type: '', unitQuantity: 0}]},
          error: new Error('No shifts found')
        },
        {
          description: 'should catch null shifts',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: null},
          error: new Error('No shifts found')
        },
        {
          description: 'should catch no name for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{types: [], lessons: []}]},
          error: new Error('No name found for shift')
        },
        {
          description: 'should catch null name for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: null, types: [], lessons: []}]},
          error: new Error('No name found for shift')
        },
        {
          description: 'should catch empty name for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: '', types: [], lessons: []}]},
          error: new Error('No name found for shift')
        },
        {
          description: 'should catch no types for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', lessons: []}]},
          error: new Error('No type found for shift SN')
        },
        {
          description: 'should catch null types for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: null, lessons: []}]},
          error: new Error('No type found for shift SN')
        },
        {
          description: 'should catch empty types for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [], lessons: []}]},
          error: new Error('No type found for shift SN')
        },
        {
          description: 'should catch no lessons for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: ['']}]},
          error: new Error('No lessons found for shift SN')
        },
        {
          description: 'should catch null lessons for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: null}]},
          error: new Error('No lessons found for shift SN')
        },
        {
          description: 'should catch empty lessons for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: []}]},
          error: new Error('No lessons found for shift SN')
        },
        {
          description: 'should catch no start for lesson',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: [{end: ''}]}]},
          error: new Error('No start found for lesson')
        },
        {
          description: 'should catch null start for lesson',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: [{start: null, end: ''}]}]},
          error: new Error('No start found for lesson')
        },
        {
          description: 'should catch empty start for lesson',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: [{start: '', end: ''}]}]},
          error: new Error('No start found for lesson')
        },
        {
          description: 'should catch no end for lesson',
          // tslint:disable-next-line:max-line-length
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: [{start: '2020-09-21 08:00:00'}]}]},
          error: new Error('No end found for lesson')
        },
        {
          description: 'should catch null end for lesson',
          // tslint:disable-next-line:max-line-length
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: [{start: '2020-09-21 08:00:00', end: null}]}]},
          error: new Error('No end found for lesson')
        },
        {
          description: 'should catch empty end for lesson',
          // tslint:disable-next-line:max-line-length
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [''], lessons: [{start: '2020-09-21 08:00:00', end: ''}]}]},
          error: new Error('No end found for lesson')
        }
      ];

      parameters.forEach(parameter => {
        it(parameter.description, () => {
          expect(() => service.parseCourseMissingInfo(parameter.input)).toThrow(parameter.error);
        });
      });
    });

    describe('Formatting type of class', () => {
      const parameters = [
        {
          description: 'should format empty type of class',
          input: '',
          output: ClassType.NONE
        },
        {
          description: 'should format theoretical type of class',
          input: 'TEORICA',
          output: ClassType.THEORY_PT
        },
        {
          description: 'should format lab type of class',
          input: 'LABORATORIAL',
          output: ClassType.LAB_PT
        },
        {
          description: 'should format problems type of class',
          input: 'PROBLEMS',
          output: ClassType.PROBLEMS_PT
        },
        {
          description: 'should format seminary type of class',
          input: 'SEMINARY',
          output: ClassType.SEMINARY_PT
        },
        {
          description: 'should format tutorial orientation type of class',
          input: 'TUTORIAL_ORIENTATION',
          output: ClassType.TUTORIAL_ORIENTATION_PT
        },
        {
          description: 'should format training period type of class',
          input: 'TRAINING_PERIOD',
          output: ClassType.TRAINING_PERIOD_PT
        },
        {
          description: 'should format field work type of class',
          input: 'FIELD_WORK',
          output: ClassType.FIELD_WORK_PT
        },
      ];

      parameters.forEach(parameter => {
        it(parameter.description, () => {
          translation.use('pt-PT');
          expect(service.formatType(parameter.input)).toBe(parameter.output);
        });
      });
    });

    describe('Filling course unimportant missing info', () => {
      class MockShift extends Shift {
        constructor() {
          super(undefined, undefined, undefined, undefined);
        }
      }

      it('should fill course missing info: no campus', () => {
        const course = new Course(123, 'C1', 'C01', [ClassType.THEORY_PT], [], [new MockShift()]);
        expect(service.fillMissingInfo(course).campus).toBe(null);
      });

      it('should fill course missing info: no types', () => {
        const course = new Course(123, 'C1', 'C01', [], ['A'], [new MockShift()]);
        expect(service.fillMissingInfo(course).types).toEqual([ClassType.NONE]);
      });

      it('should throw an error if there are no shifts', () => {
        const course = new Course(123, 'C1', 'C01', [ClassType.THEORY_PT], ['A'], []);
        expect(() => service.fillMissingInfo(course))
          .toThrow(new Error('No shifts found. Impossible to generate schedules for course: ' + course.name));
      });
    });

    describe('Checking total hours per week for a shift', () => {
      let testingService: TestingService;
      let lessons: Lesson[];

      beforeEach(() => {
        testingService = new TestingService();
        lessons = [
          testingService.createTimeOnlyLesson('mon', '08:00', '09:30'),
          testingService.createTimeOnlyLesson('wed', '08:00', '09:30')
        ];
      });

      it('should have the right amount of hours per week', () => {
        expect(service.hasTotalHoursPerWeek({[ClassType.THEORY_PT]: 3}, lessons, ClassType.THEORY_PT)).toBeTrue();
      });

      it('should NOT have the right amount of hours per week', () => {
        expect(service.hasTotalHoursPerWeek({[ClassType.THEORY_PT]: 1.5}, lessons, ClassType.THEORY_PT)).toBeFalse();
      });
    });
  });

  describe('HTTP Requests', () => {
    it('should get current academic term', async () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const currentAcademicTerm = await service.getCurrentAcademicTerm();

      currentMonth <= 8 ?
        expect(currentAcademicTerm).toBe((currentYear - 1).toString() + '/' + currentYear.toString()) :
        expect(currentAcademicTerm).toBe(currentYear.toString() + '/' + (currentYear + 1).toString());
    });

    it('should get degrees for current academic term', async () => {
      const currentAcademicTerm = await service.getCurrentAcademicTerm();
      const degrees = await service.getDegrees(currentAcademicTerm);
      expect(degrees).toBeTruthy();

      degrees.forEach((degree, i) => {
        expect(degree).toBeTruthy();
        expect(degree.constructor.name).toEqual(Degree.name);
        expect(degree.id).toBeTruthy();
        expect(degree.name).toBeTruthy();
        expect(degree.acronym).toBeTruthy();

        if (i < degrees.length - 1)
          expect(degree.acronym.localeCompare(degrees[i + 1].acronym)).toBeLessThan(0);
      });
    });

    it('should get course basic info for LEIC-A for current academic term', async () => {
      const currentAcademicTerm = await service.getCurrentAcademicTerm();
      const degreeID = 2761663971474;
      const courses = await service.getCoursesBasicInfo(currentAcademicTerm, degreeID);
      expect(courses).toBeTruthy();

      courses.forEach((course, i) => {
        expect(course).toBeTruthy();
        expect(course.constructor.name).toEqual(Course.name);
        expect(course.id).toBeTruthy();
        expect(course.name).toBeTruthy();
        expect(course.acronym).toBeTruthy();
        expect(course.acronym[0] === 'O' && course.acronym[1] >= '0' && course.acronym[1] <= '9').toBeFalse();

        if (i < courses.length - 1)
          expect(course.acronym.localeCompare(courses[i + 1].acronym)).toBeLessThan(0);
      });
    });

    it('should get missing info for course BD of degree LEIC-A', async () => {
      translation.use('pt-PT');
      let course = new Course(846035542878562, 'Base de Dados', 'BD');
      course = await service.getMissingCourseInfo(course);

      expect(course).toBeTruthy();
      expect(course.types).toEqual([ClassType.THEORY_PT, ClassType.LAB_PT]);
      expect(course.campus).toEqual(['Alameda', 'Taguspark']);
      expect(course.shifts).toBeTruthy();
      expect(course.courseLoads).toEqual({[ClassType.THEORY_PT]: 3, [ClassType.LAB_PT]: 1.5});
    });

    it('should check courses full info from all degrees for current academic term', () => {
      // TODO
    });
  });

  describe('Academic term related', () => {
    it('should get next academic term', () => {
      expect(service.getNextAcademicTerm('2020/2021')).toBe('2021/2022');
    });

    it('should get the two most recent academic terms', async () => {
      spyOn(service, 'getCurrentAcademicTerm').and.returnValue(of('2020/2021').toPromise());
      spyOn(service, 'getNextAcademicTerm').and.returnValue('2021/2022');
      expect(await service.getAcademicTerms()).toEqual(['2020/2021', '2021/2022']);
    });
  });

  describe('Course related', () => {
    it('should get course loads', () => {
      expect(service.getCourseLoads([{type: 'T', unitQuantity: '1.5'}])).toEqual({T: 1.5});
    });

    describe('Calculating course loads', () => {
      let testingService: TestingService;

      beforeEach(() => {
        testingService = new TestingService();
      });

      it('should calculate course loads correctly', () => {
        const shifts = [
          testingService.createTimeOnlyShift([{weekday: 'mon', start: '08:00', end: '09:30'}]),
          testingService.createTimeOnlyShift([{weekday: 'wed', start: '08:00', end: '09:00'}])
        ];
        shifts[0].type = ClassType.THEORY_PT;
        shifts[1].type = ClassType.LAB_PT;

        const courseLoads = service.calculateCourseLoads(shifts);
        expect(courseLoads[ClassType.THEORY_PT]).toBe(1.5);
        expect(courseLoads[ClassType.LAB_PT]).toBe(1);
      });

      it('should calculate course loads: shifts total hours vary', () => {
        const shifts = [
          testingService.createTimeOnlyShift([{weekday: 'mon', start: '08:00', end: '09:00'}]),
          testingService.createTimeOnlyShift([{weekday: 'wed', start: '08:00', end: '09:30'}])
        ];
        shifts.forEach(shift => shift.type = ClassType.THEORY_PT);
        expect(service.calculateCourseLoads(shifts)[ClassType.THEORY_PT]).toBe(1.5);
      });
    });

    it('should get course campus', () => {
      class MockShift extends Shift {
        constructor(_campus: string) {
          super(undefined, undefined, [new MockLesson(_campus), new MockLesson(_campus)], _campus);
        }
      }

      class MockLesson extends Lesson {
        constructor(_campus: string) {
          super(undefined, undefined, undefined, _campus);
        }
      }
      expect(service.getCourseCampus([new MockShift('Taguspark'), new MockShift('Alameda')]))
        .toEqual(['Alameda', 'Taguspark']);
    });

    it('should get course types', () => {
      translation.use('pt-PT');
      expect(service.getCourseTypes([{type: 'LABORATORIAL'}, {type: 'TEORICA'}]))
        .toEqual([ClassType.THEORY_PT, ClassType.LAB_PT]);
    });

    describe('Getting shift lessons', () => {
      const parameters = [
        {
          description: 'should get shift lessons: one week with less',
          input: [
            {start: '2020-09-14 08:00:00', end: '2020-09-14 09:30:00'},
            {start: '2020-09-21 08:00:00', end: '2020-09-21 09:30:00'},
            {start: '2020-09-23 08:00:00', end: '2020-09-23 09:30:00'},
            {start: '2020-09-28 08:00:00', end: '2020-09-28 09:30:00'},
            {start: '2020-09-29 08:00:00', end: '2020-09-29 09:30:00'},
            {start: '2020-10-05 08:00:00', end: '2020-10-05 09:30:00'},
            {start: '2020-10-06 08:00:00', end: '2020-10-06 09:30:00'},
          ],
          output: [
            new Lesson(new Date('2020-09-21 08:00:00'), new Date('2020-09-21 09:30:00'), 'NO ROOM FOUND', null),
            new Lesson(new Date('2020-09-23 08:00:00'), new Date('2020-09-23 09:30:00'), 'NO ROOM FOUND', null),
          ]
        },
        {
          description: 'should get shift lessons: four weeks with less',
          input: [
            {start: '2020-09-14 08:00:00', end: '2020-09-14 09:30:00'},
            {start: '2020-09-21 08:00:00', end: '2020-09-21 09:30:00'},
            {start: '2020-09-23 08:00:00', end: '2020-09-23 09:30:00'},
            {start: '2020-09-28 08:00:00', end: '2020-09-28 09:30:00'},
            {start: '2020-10-12 08:00:00', end: '2020-10-12 09:30:00'},
            {start: '2020-09-29 08:00:00', end: '2020-09-29 09:30:00'},
            {start: '2020-10-05 08:00:00', end: '2020-10-05 09:30:00'},
            {start: '2020-11-09 08:00:00', end: '2020-11-09 09:30:00'},
            {start: '2020-10-06 08:00:00', end: '2020-10-06 09:30:00'},
            {start: '2020-12-12 08:00:00', end: '2020-12-12 09:30:00'},
          ],
          output: [
            new Lesson(new Date('2020-09-21 08:00:00'), new Date('2020-09-21 09:30:00'), 'NO ROOM FOUND', null),
            new Lesson(new Date('2020-09-23 08:00:00'), new Date('2020-09-23 09:30:00'), 'NO ROOM FOUND', null),
          ]
        }
      ];

      parameters.forEach(parameter => {
        it(parameter.description, () => {
          expect(service.getShiftLessons(parameter.input)).toEqual(parameter.output);
        });
      });
    });

    it('should get shifts: one shift', () => {
      translation.use('pt-PT');
      expect(service.getShifts([{name: 'SH01', types: ['TEORICA'], lessons: [
          {start: '2020-09-14 08:00:00', end: '2020-09-14 09:30:00'},
          {start: '2020-09-21 08:00:00', end: '2020-09-21 09:30:00'},
          {start: '2020-09-23 08:00:00', end: '2020-09-23 09:30:00'},
          {start: '2020-09-28 08:00:00', end: '2020-09-28 09:30:00'},
          {start: '2020-09-29 08:00:00', end: '2020-09-29 09:30:00'},
          {start: '2020-10-05 08:00:00', end: '2020-10-05 09:30:00'},
          {start: '2020-10-06 08:00:00', end: '2020-10-06 09:30:00'},

        ]}])).toEqual([
          new Shift('SH01', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-21 08:00:00'), new Date('2020-09-21 09:30:00'), 'NO ROOM FOUND', null),
            new Lesson(new Date('2020-09-23 08:00:00'), new Date('2020-09-23 09:30:00'), 'NO ROOM FOUND', null),
          ], null)
      ]);
    });
  });
});
