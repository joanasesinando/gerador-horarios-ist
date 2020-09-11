import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {of} from 'rxjs';

import {HomepageComponent} from './homepage.component';
import {CourseCardComponent} from './course-card/course-card.component';
import {CoursesBannerComponent} from './courses-banner/courses-banner.component';
import {AboutModalComponent} from './about-modal/about-modal.component';

import {RouterTestingModule} from '@angular/router/testing';
import {TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {ReactiveFormsModule} from '@angular/forms';

import {FenixService} from '../_services/fenix.service';
import {FirebaseService} from '../_services/firebase.service';

import {Degree} from '../_domain/Degree';
import {Course} from '../_domain/Course';
import {ClassType} from '../_domain/ClassType';
import {Shift} from '../_domain/Shift';
import {Lesson} from '../_domain/Lesson';

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
    academicTerms = ['2021/2022', '2020/2021'];
    degrees = [
      new Degree(1, 'Degree #1', 'D1'),
      new Degree(2, 'Degree #2', 'D2'),
      new Degree(3, 'Degree #3', 'D3')
    ];
    courses = [
      new Course(1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
        [
          new Shift('T01', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
            new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
          ]),
          new Shift('L01', [ClassType.LAB_PT], [
            new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
          ])
        ], { Teórica: 3, Laboratorial: 1.5 }),
      new Course(2, 'Course #2', 'C2', [ClassType.THEORY_PT], ['Taguspark'],
        [
          new Shift('T01', [ClassType.THEORY_PT], [
            new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
            new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
          ])
        ], { Teórica: 3 })
    ];

    fenixServiceStub = {
      getAcademicTerms: () => of(academicTerms).toPromise()
    };

    firebaseServiceStub = {
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
        ReactiveFormsModule
      ],
      declarations: [
        HomepageComponent,
        CourseCardComponent,
        CoursesBannerComponent,
        AboutModalComponent
      ],
      providers: [
        TranslateService,
        { provide: FenixService, useValue: fenixServiceStub },
        { provide: FirebaseService, useValue: firebaseServiceStub }
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
    });

    it('should load degrees of selected academic term', async () => {
      const selectedAcademicTerm = academicTerms[0];
      await expectAsync(component.loadDegrees(selectedAcademicTerm)).toBeResolved();
      expect(component.degrees).toBe(degrees);
    });

    it('should load courses of selected degree', async () => {
      const selectedAcademicTerm = academicTerms[0];
      await expectAsync(component.loadDegrees(selectedAcademicTerm)).toBeResolved();

      const selectedDegree = degrees[0];
      await expectAsync(component.loadCoursesBasicInfo(selectedAcademicTerm, selectedDegree.id)).toBeResolved();
      expect(component.courses).toEqual(courses);
    });

  });


  describe('Testing functionality', () => {
    beforeEach(async () => {
      const selectedAcademicTerm = academicTerms[0];
      await component.loadDegrees(selectedAcademicTerm);

      const selectedDegree = degrees[0];
      await component.loadCoursesBasicInfo(selectedAcademicTerm, selectedDegree.id);
    });

    describe('Adding a course', () => {

      it('should add a course successfully', () => {
        const courseToAdd = courses[0];
        const index = 0;

        component.addCourse(courseToAdd.id);
        courses.splice(index, 1);

        expect(component.selectedCourses).toEqual([courseToAdd]);
        expect(component.selectedCoursesIDs.has(courseToAdd.id)).toBeTrue();
        expect(component.courses).toEqual(courses);
      });

    });

  });

});
