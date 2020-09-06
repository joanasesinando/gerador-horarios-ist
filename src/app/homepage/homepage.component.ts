import {Component, HostListener, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {LoggerService} from '../_util/logger.service';
import {Course} from '../_domain/Course';
import {Degree} from '../_domain/Degree';

import {FenixService} from '../_services/fenix.service';
import {FirebaseService} from '../_services/firebase.service';

import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {
  faCommentAlt,
  faChevronDown,
  faSmileBeam,
  faTh,
  faThumbtack,
  faQuestion,
  faGlobeEurope
} from '@fortawesome/free-solid-svg-icons';

declare let $;


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  mobileView = false;
  featuresHorizontal = false;

  academicTerms: string[] = [];
  degrees: Degree[] = [];
  courses: Course[] = [];

  selectedCourses: Course[] = [];
  selectedCoursesIDs = new Map();
  campusPicked = new Map();
  typesOfClassesPicked = new Map();

  generateForm = new FormGroup({
    academicTerm: new FormControl({value: null, disabled: true}),
    degree: new FormControl({value: null, disabled: true}),
    course: new FormControl({value: null, disabled: true}),
  });

  get academicTermFormControl(): AbstractControl { return this.generateForm.get('academicTerm'); }
  get degreeFormControl(): AbstractControl { return this.generateForm.get('degree'); }
  get courseFormControl(): AbstractControl { return this.generateForm.get('course'); }

  spinners = {
    academicTerm: true,
    degree: false,
    course: false
  };

  // FontAwesome icons
  faGithub = faGithub;
  faCommentAlt = faCommentAlt;
  faChevronDown = faChevronDown;
  faSmileBeam = faSmileBeam;
  faThumbtack = faThumbtack;
  faTh = faTh;
  faQuestion = faQuestion;
  faGlobeEurope = faGlobeEurope;

  constructor(
    private logger: LoggerService,
    private fenixService: FenixService,
    public translateService: TranslateService,
    public firebaseService: FirebaseService,
    private router: Router) {

    // Translation
    translateService.addLangs(['pt-PT', 'en-GB']);
    translateService.setDefaultLang('pt-PT');
    const browserLang = translateService.getBrowserLang();
    translateService.use(browserLang.match(/pt-PT|en-GB/) ? browserLang : 'pt-PT');

    // Widgets translation subscription
    this.translateService.stream('sidebar.widgets.repo').subscribe(value => {
      const widget = $('#widget-github');
      widget.attr('title', value);
      widget.tooltip('dispose');
      widget.tooltip();
    });

    this.translateService.stream('sidebar.widgets.help').subscribe(value => {
      const widget = $('#widget-help');
      widget.attr('title', value);
      widget.tooltip('dispose');
      widget.tooltip();
    });

    // Get academic terms
    this.fenixService.getAcademicTerms().then(academicTerms => {
      this.academicTerms = academicTerms;
      this.academicTermFormControl.enable();
      this.spinners.academicTerm = false;
      this.logger.log('academic terms', this.academicTerms);
    });
  }

  ngOnInit(): void {
    this.onWindowResize();
    $('[data-toggle="tooltip"]').tooltip();
  }

  hasAcademicTermSelected(): boolean { return this.academicTermFormControl.value != null; }
  hasDegreeSelected(): boolean { return this.degreeFormControl.value != null; }
  hasCourseSelected(): boolean { return this.courseFormControl.value != null; }

  lowercase(s: string): string {
    return s.toLowerCase();
  }

  showScrollDown(): boolean {
    return this.mobileView && window.innerHeight > 590 && window.innerWidth <= 767;
  }

  loadDegrees(): void {
    const academicTerm = $('#inputAcademicTerm').val();
    this.spinners.degree = true;
    this.firebaseService.hasDegrees(academicTerm).then(has => {
      if (has) {
        this.logger.log('has degrees saved');
        this.firebaseService.getDegrees(academicTerm).then(degrees => {
          this.degrees = degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
          this.degreeFormControl.enable();
          this.spinners.degree = false;
          this.logger.log('degrees', this.degrees);
        });

      } else {
        this.logger.log('no degrees found');
        this.fenixService.getDegrees(academicTerm).then(degrees => {
          this.degrees = degrees;
          this.degreeFormControl.enable();
          this.spinners.degree = false;
          this.logger.log('degrees', this.degrees);

          // Load to database
          const error = {found: false, type: null};
          for (const degree of this.degrees) {
            this.firebaseService.loadDegree(academicTerm, degree)
              .catch((err) => { error.found = true; error.type = err; });
          }
          error.found ? this.logger.log('error saving degrees:', error.type) : this.logger.log('degrees successfully saved');
        });
      }
    });
  }

  loadCoursesBasicInfo(): void {
    const academicTerm = $('#inputAcademicTerm').val();
    const degreeId = $('#inputDegree').val();
    this.spinners.course = true;
    this.firebaseService.hasCourses(academicTerm, degreeId).then(has => {
      if (has) {
        this.logger.log('has courses saved');
        this.firebaseService.getCourses(academicTerm, degreeId).then(courses => {
          this.courses = courses
            .sort((a, b) => a.acronym.localeCompare(b.acronym))
            .filter((course) => !this.selectedCoursesIDs.has(course.id));
          this.courseFormControl.enable();
          this.spinners.course = false;
          this.logger.log('courses', this.courses);
        });
      } else {
        this.logger.log('no courses found');
        this.fenixService.getCoursesBasicInfo(academicTerm, degreeId).then(courses => {
          this.courses = courses.filter((course) => !this.selectedCoursesIDs.has(course.id));
          this.courseFormControl.enable();
          this.spinners.course = false;
          this.logger.log('courses', this.courses);

          // Load to database
          const error = {found: false, type: null};
          for (const course of this.courses) {
            this.firebaseService.loadCourse(academicTerm, degreeId, course)
              .catch((err) => { error.found = true; error.type = err; });
          }
          error.found ? this.logger.log('error saving courses:', error.type) : this.logger.log('courses successfully saved');
        });
      }
    });
  }

  addCourse(): void {
    const courseIndex = $('#inputCourse').val();

    if (courseIndex && courseIndex !== 'null') {
      const addBtn = $('#addBtn');
      addBtn.attr('disabled', true);
      let courseToAdd = this.courses[courseIndex];

      if (courseToAdd.hasFullInfo()) {
        this.addCourseHelper(courseToAdd, courseIndex, addBtn);

      } else {

        // Load rest of info
        this.spinners.course = true;
        this.fenixService.loadMissingCourseInfo(courseToAdd).then(course => {
          courseToAdd = course;
          this.spinners.course = false;
          this.addCourseHelper(courseToAdd, courseIndex, addBtn);

          // Load to database
          const error = {found: false, type: null};
          const academicTerm = $('#inputAcademicTerm').val();
          const degreeId = $('#inputDegree').val();
          this.firebaseService.updateCourse(academicTerm, degreeId, courseToAdd)
            .catch((err) => { error.found = true; error.type = err; });
          error.found ? this.logger.log('error saving courses:', error.type) : this.logger.log('course successfully updated');
        });
      }
    }
  }

  addCourseHelper(course, index, addBtn): void {
    // Update arrays
    this.selectedCourses.unshift(course);
    this.selectedCoursesIDs.set(course.id, true);
    this.courses.splice(index, 1);

    // Remove course from select
    $('#' + course.id).remove();

    addBtn.attr('disabled', false);
    this.logger.log('selected courses', this.selectedCourses);
  }

  removeCourse(index: number): void {
    const academicTerm = $('#inputAcademicTerm').val();
    const degreeId = $('#inputDegree').val();
    const courseToRemove = this.selectedCourses[index];

    this.firebaseService.hasDocument(academicTerm.replace('/', '-'), degreeId, 'courses', courseToRemove.id).then(has => {
      // Add back to select if same degree
      if (has) {
        this.courses.push(courseToRemove);
        this.courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      }

      this.selectedCourses.splice(index, 1);
      this.selectedCoursesIDs.delete(courseToRemove.id);
      this.logger.log('selected courses', this.selectedCourses);
    });
  }

  pickCourseCampus(selected: {index: number, data: string}): void {
    this.campusPicked.set(selected.index, [selected.data]);
  }

  pickTypesOfClasses(selected: {index: number, data: string[]}): void {
    this.typesOfClassesPicked.set(selected.index, selected.data);
  }

  generateSchedules(): void {
    if (this.selectedCourses.length > 0) {
      // Update selected courses based on user choice
      for (const key of this.campusPicked.keys()) {
        this.selectedCourses[key].campus = this.campusPicked.get(key);
      }
      for (const key of this.typesOfClassesPicked.keys()) {
        this.selectedCourses[key].types = this.typesOfClassesPicked.get(key);
      }

      this.router.navigate(['/generate-schedules'], {state: {data: this.selectedCourses}});
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
    this.featuresHorizontal = window.innerWidth >= 1400 || (window.innerWidth >= 550 && window.innerWidth <= 767) ;
  }

}
