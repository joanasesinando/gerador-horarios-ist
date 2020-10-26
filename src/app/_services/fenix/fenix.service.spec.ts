import {TestBed} from '@angular/core/testing';

import {FenixService} from './fenix.service';
import {TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {Course} from '../../_domain/Course/Course';
import {ClassType} from '../../_domain/ClassType/ClassType';
import {Shift} from '../../_domain/Shift/Shift';
import {TestingService} from '../../_util/testing.service';
import {Lesson} from '../../_domain/Lesson/Lesson';
import {of} from 'rxjs';


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
          description: 'should parse a degree: no name',
          input: {id: 123, acronym: 'DG01'},
          error: new Error('No name found for degree 123')
        },
        {
          description: 'should parse a degree: no acronym',
          input: {id: 123, name: 'Degree Name'},
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
    });

    describe('Invalid course basic info parsing', () => {
      const parameters = [
        {
          description: 'should parse course basic info: no ID',
          input: {name: 'Course Name', acronym: 'CS01'},
          error: new Error('No ID found for course')
        },
        {
          description: 'should parse course basic info: no name',
          input: {id: 123, acronym: 'CS01'},
          error: new Error('No name found for course 123')
        },
        {
          description: 'should parse course basic info: no acronym',
          input: {id: 123, name: 'Course Name'},
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
          description: 'should catch no type in course loads',
          input: {courseLoads: [{unitQuantity: 0}], shifts: undefined},
          error: new Error('No type found in courseLoads')
        },
        {
          description: 'should catch no unitQuantity in course loads',
          input: {courseLoads: [{type: ''}], shifts: undefined},
          error: new Error('No unitQuantity found in courseLoads')
        },
        {
          description: 'should catch no shifts',
          input: {courseLoads: [{type: '', unitQuantity: 0}]},
          error: new Error('No shifts found')
        },
        {
          description: 'should catch no name for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{types: [], lessons: []}]},
          error: new Error('No name found for shift')
        },
        {
          description: 'should catch no types for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', lessons: []}]},
          error: new Error('No type found for shift SN')
        },
        {
          description: 'should catch no lessons for shift',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: []}]},
          error: new Error('No lessons found for shift SN')
        },
        {
          description: 'should catch no start for lesson',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [], lessons: [{end: ''}]}]},
          error: new Error('No start found for lesson')
        },
        {
          description: 'should catch no end for lesson',
          input: {courseLoads: [{type: '', unitQuantity: 0}], shifts: [{name: 'SN', types: [], lessons: [{start: ''}]}]},
          error: new Error('No end found for lesson')
        }
      ];

      parameters.forEach(parameter => {
        it(parameter.description, () => {
          expect(() => service.parseCourseMissingInfo(parameter.input)).toThrow(parameter.error);
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
        expect(service.hasTotalHoursPerWeek({type: 3}, lessons, 'type')).toBeTrue();
      });

      it('should NOT have the right amount of hours per week', () => {
        expect(service.hasTotalHoursPerWeek({type: 1.5}, lessons, 'type')).toBeFalse();
      });
    });
  });

  describe('HTTP Requests', () => {
    it('should get current academic term', () => {
      // TODO
    });

    it('should get degrees for an academic term', () => {
      // TODO
    });

    it('should get course basic info for an academic term & degree', () => {
      // TODO
    });

    it('should load missing course info to DB', () => {
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

    it('should get shift lessons', () => {
      // TODO
    });

    it('should get shifts', () => {
      // TODO
    });
  });
});
