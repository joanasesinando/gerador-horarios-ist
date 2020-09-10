import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import {of} from 'rxjs';

import { HomepageComponent } from './homepage.component';
import { CourseCardComponent } from './course-card/course-card.component';
import { CoursesBannerComponent } from './courses-banner/courses-banner.component';
import { AboutModalComponent } from './about-modal/about-modal.component';

import { RouterTestingModule } from '@angular/router/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReactiveFormsModule } from '@angular/forms';

import { FenixService } from '../_services/fenix.service';
import { FirebaseService } from '../_services/firebase.service';

describe('HomepageComponent', () => {
  let component: HomepageComponent;
  let fixture: ComponentFixture<HomepageComponent>;
  let de: DebugElement;

  let fenixServiceStub: any;
  let firebaseServiceStub: any;

  beforeEach(async(() => {
    fenixServiceStub = {
      getAcademicTerms: () => of(['2020/2021']).toPromise()
    };

    // Not really using it for anything
    // Otherwise, build on the stub or create a spy
    firebaseServiceStub = { };

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

  it('should have academic terms', () => {
    // wait on academic terms
    setTimeout(() => {
      expect(component.academicTerms).toBe(['2020/2021']);
    }, 500);
  });

  it('should pass courses to generate correctly', () => {

  });
});
