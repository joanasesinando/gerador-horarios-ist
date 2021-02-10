import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {of} from 'rxjs';
import _ from 'lodash';

import {HomepageComponent} from './homepage.component';
import {CourseCardComponent} from './course-card/course-card.component';
import {CoursesBannerComponent} from './courses-banner/courses-banner.component';
import {AboutModalComponent} from './about-modal/about-modal.component';

import {RouterTestingModule} from '@angular/router/testing';
import {TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {FenixService} from '../_services/fenix/fenix.service';
import {FirebaseService} from '../_services/firebase/firebase.service';
import {StateService} from '../_services/state/state.service';

import {Degree} from '../_domain/Degree/Degree';
import {Course} from '../_domain/Course/Course';
import {ClassType} from '../_domain/ClassType/ClassType';
import {Shift} from '../_domain/Shift/Shift';
import {Lesson} from '../_domain/Lesson/Lesson';
import {HelpModalComponent} from './help-modal/help-modal.component';

describe('HomepageComponent', () => {
  let component: HomepageComponent;
  let fixture: ComponentFixture<HomepageComponent>;
  let de: DebugElement;

  let fenixServiceStub: any;
  let firebaseServiceStub: any;

  let academicTerms: string[];
  let degrees: Degree[];
  let courses: Course[];

  beforeEach(async(() => {
    academicTerms = ['2020/2021', '2021/2022'];
    degrees = [
      new Degree(1, 'Degree #1', 'D1'),
      new Degree(2, 'Degree #2', 'D2'),
      new Degree(3, 'Degree #3', 'D3')
    ];
    courses = [
      new Course(1, 'Course #1', 'C1', 4.5, 1, [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
        [
          new Shift('T01', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
            new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('L01', ClassType.LAB_PT, [
            new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
          ], 'Alameda')
        ], { TEORICA: 3, LABORATORIAL: 1.5 }),
      new Course(2, 'Course #2', 'C2', 4.5,  1, [ClassType.THEORY_PT], ['Taguspark'],
        [
          new Shift('T01', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Taguspark'),
            new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Taguspark')
          ], 'Taguspark')
        ], { TEORICA: 3 }),
      new Course(3, 'Course #3', 'C3', 4.5,  1, [ClassType.THEORY_PT, ClassType.PROBLEMS_PT], ['Alameda'],
        [
          new Shift('T01', ClassType.THEORY_PT, [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
            new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
          ], 'Alameda'),
          new Shift('PB01', ClassType.PROBLEMS_PT, [
            new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
          ], 'Alameda')
        ], { TEORICA: 3, PROBLEMS: 1.5 })
    ];

    fenixServiceStub = {
      getAcademicTerms: () => of(academicTerms).toPromise()
    };

    firebaseServiceStub = {
      getLastTimeUpdatedTimestamp: () => of(Date.now()).toPromise(),
      hasDegrees: () => of(true).toPromise(),
      getDegrees: () => of(degrees).toPromise(),
      hasCourses: () => of(true).toPromise(),
      getCourses: () => of(courses).toPromise()
    };

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        }),
        RouterTestingModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        FormsModule
      ],
      declarations: [
        HomepageComponent,
        CourseCardComponent,
        CoursesBannerComponent,
        AboutModalComponent,
        HelpModalComponent
      ],
      providers: [
        TranslateService,
        { provide: FenixService, useValue: fenixServiceStub },
        { provide: FirebaseService, useValue: firebaseServiceStub },
        StateService
      ]
    })
      .compileComponents(); // compiles template and css
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Loading academic terms, degrees, and courses', () => {

    it('should load academic terms', async () => {
      await expectAsync(fenixServiceStub.getAcademicTerms()).toBeResolved();
      expect(component.academicTerms).toBe(academicTerms);
      expect(component.stateService.academicTermsRepository).toEqual(academicTerms);
    });

    it('should load degrees of selected academic term', async () => {
      const selectedAcademicTerm = academicTerms[0];
      await expectAsync(component.loadDegrees(selectedAcademicTerm)).toBeResolved();
      expect(component.degrees).toBe(degrees);
      expect(component.stateService.degreesRepository.get(selectedAcademicTerm)).toEqual(degrees);
    });

    it('should load courses of selected degree', async () => {
      const selectedAcademicTerm = academicTerms[0];
      await expectAsync(component.loadDegrees(selectedAcademicTerm)).toBeResolved();

      const selectedDegree = degrees[0];
      await expectAsync(component.loadCoursesBasicInfo(selectedAcademicTerm, selectedDegree.id)).toBeResolved();
      expect(component.courses).toEqual(courses);
      expect(component.stateService.coursesRepository.get(selectedAcademicTerm).get(selectedDegree.id)).toEqual(courses);
    });

  });


  describe('Testing functionality', () => {

    let selectedAcademicTerm: string;
    let selectedDegree: Degree;

    beforeEach(async () => {
      selectedAcademicTerm = academicTerms[0];
      await component.loadDegrees(selectedAcademicTerm);

      selectedDegree = degrees[0];
      await component.loadCoursesBasicInfo(selectedAcademicTerm, selectedDegree.id);
    });

    describe('Adding courses', () => {

      it('should add a course successfully', () => {
        const courseToAdd = courses[0];
        const index = 0;

        // Add course
        component.addCourse(courseToAdd.id);
        courses.splice(index, 1);

        expect(component.selectedCourses).toEqual([courseToAdd]);
        expect(component.selectedCoursesIDs.has(courseToAdd.id)).toBeTrue();
        expect(component.courses).toEqual(courses);
        expect(component.totalCredits).toBe(4.5);
      });

      it('should add two courses in a row successfully', () => {
        const courseToAdd1 = courses[0];
        const courseToAdd2 = courses[1];
        const index = 0;

        // Add course1
        component.addCourse(courseToAdd1.id);
        courses.splice(index, 1);

        // Add course2
        component.addCourse(courseToAdd2.id);
        courses.splice(index, 1);

        expect(component.selectedCourses).toEqual([courseToAdd2, courseToAdd1]);
        expect(component.selectedCoursesIDs.has(courseToAdd1.id)).toBeTrue();
        expect(component.selectedCoursesIDs.has(courseToAdd2.id)).toBeTrue();
        expect(component.courses).toEqual(courses);
        expect(component.totalCredits).toBe(9);
      });

      it('should add all courses of a degree', () => {
        const coursesToAdd = _.cloneDeep(courses);

        for (let i = courses.length - 1; i >= 0; i--) {
          const courseToAdd = courses[i];
          component.addCourse(courseToAdd.id);
          courses.pop();
          expect(component.selectedCoursesIDs.has(courseToAdd.id)).toBeTrue();
        }

        expect(component.selectedCourses).toEqual(coursesToAdd);
        expect(component.courses).toEqual([]);
        expect(component.totalCredits).toBe(13.5);
      });


      it('should add two courses from different degrees', async () => {
        const courseToAdd1 = courses[0];
        const index = 0;

        // Add course1
        component.addCourse(courseToAdd1.id);
        courses.splice(index, 1);

        // Pick another degree
        selectedDegree = degrees[1];
        await component.loadCoursesBasicInfo(selectedAcademicTerm, selectedDegree.id);

        // Add course2
        const courseToAdd2 = courses[0];
        component.addCourse(courseToAdd2.id);
        courses.splice(index, 1);

        expect(component.selectedCourses).toEqual([courseToAdd2, courseToAdd1]);
        expect(component.selectedCoursesIDs.has(courseToAdd1.id)).toBeTrue();
        expect(component.selectedCoursesIDs.has(courseToAdd2.id)).toBeTrue();
        expect(component.courses).toEqual(courses);
        expect(component.totalCredits).toBe(9);
      });

      describe('Testing invalid inputs', () => {
        const parameters = [
          {description: 'should NOT add a course that doesnt exist on courses', input: 0},
          {description: 'should NOT add a course when courses are empty', input: -1},
          {description: 'should NOT add a course when no course selected to add', input: null},
        ];

        parameters.forEach((parameter) => {
          it(parameter.description, () => {
            // Add invalid course
            component.addCourse(parameter.input);

            expect(component.selectedCourses).toEqual([]);
            expect(component.selectedCoursesIDs.size).toBe(0);
            expect(component.courses).toEqual(courses);
            expect(component.totalCredits).toBe(0);
          });
        });

        it('should NOT add a course that has no shifts', () => {
          courses.push(new Course(
            4, 'Course #4', 'C4', 4.5,  1, [ClassType.THEORY_PT], ['Alameda'],
            [], { TEORICA: 2 }));

          try {
            component.addCourse(4);
          } catch (error) {
            expect(error).toBe('No shifts found. Impossible to generate schedules for course: Course #4');
            expect(component.selectedCourses).toEqual([]);
            expect(component.selectedCoursesIDs.size).toBe(0);
            expect(component.courses).toEqual(courses);
            expect(component.totalCredits).toBe(0);
          }
        });

        it('should NOT add a course when not enough credits left', () => {
          component.totalCredits = 42;
          component.addCourse(1);

          expect(component.selectedCourses).toEqual([]);
          expect(component.selectedCoursesIDs.size).toBe(0);
          expect(component.courses).toEqual(courses);
          expect(component.totalCredits).toBe(42);
        });
      });

    });

    describe('Removing courses', () => {
      let course1: Course;
      let course2: Course;

      beforeEach(() => {
        course1 = courses[0];
        course2 = courses[1];

        // Add courses
        component.addCourse(course1.id);
        component.addCourse(course2.id);
        courses.splice(0, 2);

        // Set form values
        component.selectedAcademicTerm = selectedAcademicTerm;
        component.selectedDegree = selectedDegree.id;
      });

      it('should remove a course successfully', () => {
        const courseToRemove = component.selectedCourses[0];

        // Remove course
        component.removeCourse(courseToRemove.id);
        courses.push(courseToRemove);
        courses.sort((a, b) => a.acronym.localeCompare(b.acronym));

        expect(component.courses).toEqual(courses);
        expect(component.selectedCourses).toEqual([course1]);
        expect(component.selectedCoursesIDs.has(courseToRemove.id)).toBeFalse();
        expect(component.totalCredits).toBe(4.5);
      });

      it('should remove two courses in a row', () => {
        const courseToRemove1 = component.selectedCourses[0];
        const courseToRemove2 = component.selectedCourses[1];

        // Remove course1
        component.removeCourse(courseToRemove1.id);
        courses.push(courseToRemove1);

        // Remove course2
        component.removeCourse(courseToRemove2.id);
        courses.push(courseToRemove2);
        courses.sort((a, b) => a.acronym.localeCompare(b.acronym));

        expect(component.courses).toEqual(courses);
        expect(component.selectedCourses).toEqual([]);
        expect(component.selectedCoursesIDs.has(courseToRemove1.id)).toBeFalse();
        expect(component.selectedCoursesIDs.has(courseToRemove2.id)).toBeFalse();
        expect(component.totalCredits).toBe(0);
      });

      it('should remove all courses selected', () => {
        for (let i = component.selectedCourses.length - 1; i >= 0; i--) {
          const courseToRemove = component.selectedCourses[i];
          component.removeCourse(courseToRemove.id);
          courses.push(courseToRemove);
          expect(component.selectedCoursesIDs.has(courseToRemove.id)).toBeFalse();
        }
        courses.sort((a, b) => a.acronym.localeCompare(b.acronym));

        expect(component.courses).toEqual(courses);
        expect(component.selectedCourses).toEqual([]);
        expect(component.totalCredits).toBe(0);
      });

      it('should remove a course from a degree not currently selected', () => {
        selectedDegree = degrees[1];
        component.selectedDegree = selectedDegree.id;

        const courseToRemove = component.selectedCourses[0];
        component.removeCourse(courseToRemove.id);

        expect(component.courses).toEqual(courses);
        expect(component.selectedCourses).toEqual([course1]);
        expect(component.selectedCoursesIDs.has(courseToRemove.id)).toBeFalse();
        expect(component.totalCredits).toBe(4.5);
      });

      it('should NOT remove a course not selected', () => {
        const courseToRemove = courses[0];
        expect(component.removeCourse(courseToRemove.id)).toBe(null);

        expect(component.courses).toEqual(courses);
        expect(component.selectedCourses).toEqual([course2, course1]);
        expect(component.selectedCoursesIDs.has(courseToRemove.id)).toBeFalse();
        expect(component.totalCredits).toBe(9);
      });

    });

    describe('Preparing courses to generate schedules for', () => {
      let course: Course;

      beforeEach(() => {
        course = new Course(
          1,
          'Course #1',
          'C1',
          4.5,
          1,
          [ClassType.THEORY_PT, ClassType.LAB_PT],
          ['Alameda', 'Taguspark'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
            ], 'Alameda'),
            new Shift('T02', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Taguspark'),
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Taguspark')
            ], 'Taguspark'),
            new Shift('L01', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
            ], 'Alameda'),
            new Shift('L02', ClassType.LAB_PT, [
              new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Taguspark')
            ], 'Taguspark')
          ],
          { TEORICA: 3, LABORATORIAL: 1.5 });

        // Add course
        component.addCourse(course.id);
        component.stateService.selectedCourses = _.cloneDeep(component.selectedCourses);
      });

      it('should update campus based on user choice', () => {
        const campusSelected = course.campus[0];

        component.pickCourseCampus({courseID: course.id, campus: campusSelected});
        expect(component.campusPicked.has(course.id)).toBeTrue();
        expect(component.campusPicked.get(course.id)).toEqual([campusSelected]);

        component.updateCampus();
        const courseSelected = component.selectedCourses[0];
        expect(courseSelected.campus).toEqual([campusSelected]);
      });

      it('should update types of classes based on user choice', () => {
        const typesSelected = [ClassType.THEORY_PT];

        component.pickTypesOfClasses({courseID: course.id, types: typesSelected});
        expect(component.typesOfClassesPicked.has(course.id)).toBeTrue();
        expect(component.typesOfClassesPicked.get(course.id)).toEqual(typesSelected);

        component.updateTypesOfClasses();
        const courseSelected = component.stateService.selectedCourses[0];
        expect(courseSelected.types).toEqual(typesSelected);
      });

      it('should update campus & types of classes based on user choice', () => {
        const campusSelected = course.campus[0];
        const typesSelected = [ClassType.THEORY_PT];

        component.pickCourseCampus({courseID: course.id, campus: campusSelected});
        expect(component.campusPicked.has(course.id)).toBeTrue();
        expect(component.campusPicked.get(course.id)).toEqual([campusSelected]);

        component.pickTypesOfClasses({courseID: course.id, types: typesSelected});
        expect(component.typesOfClassesPicked.has(course.id)).toBeTrue();
        expect(component.typesOfClassesPicked.get(course.id)).toEqual(typesSelected);

        component.updateCampus();
        component.updateTypesOfClasses();

        const courseSelected = component.stateService.selectedCourses[0];
        expect(courseSelected.campus).toEqual([campusSelected]);
        expect(courseSelected.types).toEqual(typesSelected);
      });

      it('should remove shifts not held on selected campus', () => {
        const campusSelected = course.campus[0];
        component.pickCourseCampus({courseID: course.id, campus: campusSelected});

        component.removeShiftsBasedOnCampus(course);
        const courseSelected = component.stateService.selectedCourses[0];
        courseSelected.shifts.forEach(shift => {
          expect(shift.campus).toEqual(campusSelected);
        });
      });

      it('should remove shifts with types of classes not selected', () => {
        const typesSelected = [ClassType.THEORY_PT];
        component.pickTypesOfClasses({courseID: course.id, types: typesSelected});

        component.removeShiftsBasedOnTypesOfClasses(course);
        const courseSelected = component.stateService.selectedCourses[0];
        courseSelected.shifts.forEach(shift => {
          expect(typesSelected.includes(shift.type));
        });
      });

      it('should prepare one course successfully', () => {
        const campusSelected = course.campus[0];
        const typesSelected = [ClassType.THEORY_PT];

        component.pickCourseCampus({courseID: course.id, campus: campusSelected});
        expect(component.campusPicked.has(course.id)).toBeTrue();
        expect(component.campusPicked.get(course.id)).toEqual([campusSelected]);

        component.pickTypesOfClasses({courseID: course.id, types: typesSelected});
        expect(component.typesOfClassesPicked.has(course.id)).toBeTrue();
        expect(component.typesOfClassesPicked.get(course.id)).toEqual(typesSelected);

        component.prepareCoursesToGenerate();
        const courseSelected = component.stateService.selectedCourses[0];

        expect(courseSelected.campus).toEqual([campusSelected]);
        expect(courseSelected.types).toEqual(typesSelected);

        courseSelected.shifts.forEach(shift => {
          expect(shift.campus).toEqual(campusSelected);
        });

        courseSelected.shifts.forEach(shift => {
          expect(typesSelected.includes(shift.type));
        });
      });

      it('should prepare two courses successfully', () => {
        const course2 = new Course(
          2,
          'Course #2',
          'C2',
          4.5,
          1,
          [ClassType.THEORY_PT],
          ['Alameda'],
          [
            new Shift('T01', ClassType.THEORY_PT, [
              new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
              new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
            ], 'Alameda')
          ],
          { TEORICA: 3 });

        // Add course
        component.addCourse(course2.id);
        component.stateService.selectedCourses = _.cloneDeep(component.selectedCourses);

        const campusSelected = course.campus[0];
        const typesSelected = [ClassType.THEORY_PT];

        component.pickCourseCampus({courseID: course.id, campus: campusSelected});
        component.pickTypesOfClasses({courseID: course.id, types: typesSelected});
        component.pickCourseCampus({courseID: course2.id, campus: campusSelected});
        component.pickTypesOfClasses({courseID: course2.id, types: typesSelected});

        component.prepareCoursesToGenerate();
        component.stateService.selectedCourses.forEach(courseSelected => {
          expect(courseSelected.campus).toEqual([campusSelected]);
          expect(courseSelected.types).toEqual(typesSelected);

          courseSelected.shifts.forEach(shift => {
            expect(shift.campus).toEqual(campusSelected);
          });

          courseSelected.shifts.forEach(shift => {
            expect(typesSelected.includes(shift.type));
          });
        });
      });

    });

  });

});
