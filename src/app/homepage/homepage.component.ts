import {Component, HostListener, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

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
import {of} from 'rxjs';

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
    course: new FormControl({value: -1, disabled: true}),
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
    // TODO: only show current and next (API about)
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
  hasCourseSelected(): boolean { return this.courseFormControl.value !== -1; }

  showScrollDown(): boolean {
    return this.mobileView && window.innerHeight > 590 && window.innerWidth <= 767;
  }

  // TODO: same academic term; reset when picking different
  loadDegrees(academicTerm: string): Promise<void | Degree[]> {
    this.spinners.degree = true;
    return this.firebaseService.hasDegrees(academicTerm).then(has => {
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

  loadCoursesBasicInfo(academicTerm: string, degreeID: number): Promise<void | Course[]> {
    this.spinners.course = true;
    return this.firebaseService.hasCourses(academicTerm, degreeID).then(has => {
      if (has) {
        this.logger.log('has courses saved');
        this.firebaseService.getCourses(academicTerm, degreeID).then(courses => {
          this.courses = courses
            .sort((a, b) => a.acronym.localeCompare(b.acronym))
            .filter((course) => !this.selectedCoursesIDs.has(course.id));
          this.courseFormControl.enable();
          this.spinners.course = false;
          this.logger.log('courses', this.courses);
        });
      } else {
        this.logger.log('no courses found');
        this.fenixService.getCoursesBasicInfo(academicTerm, degreeID).then(courses => {
          this.courses = courses.filter((course) => !this.selectedCoursesIDs.has(course.id));
          this.courseFormControl.enable();
          this.spinners.course = false;
          this.logger.log('courses', this.courses);

          // Load to database
          const error = {found: false, type: null};
          for (const course of this.courses) {
            this.firebaseService.loadCourse(academicTerm, degreeID, course)
              .catch((err) => { error.found = true; error.type = err; });
          }
          error.found ? this.logger.log('error saving courses:', error.type) : this.logger.log('courses successfully saved');
        });
      }
    });
  }

  addCourse(courseID: number): void {
    const courseIndex = this.findCourseIndex(courseID, this.courses);

    if (courseID && courseID !== -1 && courseIndex != null) {
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

    // Reset select
    this.courseFormControl.patchValue(-1);

    addBtn.attr('disabled', false);
    this.logger.log('selected courses', this.selectedCourses);
  }

  removeCourse(courseID: number): Promise<void> | Promise<null> {
    const academicTerm = this.academicTermFormControl.value;
    const degreeID = this.degreeFormControl.value;
    const courseIndex = this.findCourseIndex(courseID, this.selectedCourses);

    // Course to remove is not selected
    if (courseIndex == null) { return of(null).toPromise(); }

    return this.firebaseService.hasCourseInDegree(academicTerm, degreeID, courseID).then(has => {
      // Add back to select if same degree
      if (has) {
        const courseToRemove = this.selectedCourses[courseIndex];
        this.courses.push(courseToRemove);
        this.courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      }

      this.selectedCourses.splice(courseIndex, 1);
      this.selectedCoursesIDs.delete(courseID);
      this.logger.log('selected courses', this.selectedCourses);
    });
  }

  findCourseIndex(courseID: number, courses: Course[]): number {
    let index = 0;
    for (const course of courses) {
      if (course.id === courseID) { return index; }
      index++;
    }
    return null;
  }

  pickCourseCampus(selected: {courseID: number, campus: string}): void {
    this.campusPicked.set(selected.courseID, [selected.campus]);
  }

  pickTypesOfClasses(selected: {courseID: number, types: string[]}): void {
    this.typesOfClassesPicked.set(selected.courseID, selected.types);
  }

  generateSchedules(): void {
    if (this.selectedCourses.length > 0) {
      this.prepareCoursesToGenerate();
      this.router.navigate(['/generate-schedules'], {state: {data: this.selectedCourses}});
    }
  }

  prepareCoursesToGenerate(): void {
    this.updateCampus();
    this.updateTypesOfClasses();

    for (const course of this.selectedCourses) {
      this.removeShiftsBasedOnCampus(course);
      this.removeShiftsBasedOnTypesOfClasses(course);
    }
  }

  /* -----------------------------------------------------------
   * Update campus based on user choice
   * ----------------------------------------------------------- */
  updateCampus(): void {
    for (const key of this.campusPicked.keys()) {
      const index = this.findCourseIndex(key, this.selectedCourses);
      this.selectedCourses[index].campus = this.campusPicked.get(key);
    }
  }

  /* -----------------------------------------------------------
   * Update types of classes based on user choice
   * ----------------------------------------------------------- */
  updateTypesOfClasses(): void {
    for (const key of this.typesOfClassesPicked.keys()) {
      const index = this.findCourseIndex(key, this.selectedCourses);
      this.selectedCourses[index].types = this.typesOfClassesPicked.get(key);
    }
  }

  /* -----------------------------------------------------------
   * Remove shifts not held on selected campus
   * ----------------------------------------------------------- */
  removeShiftsBasedOnCampus(course: Course): void {
    for (let i = course.shifts.length - 1; i >= 0; i--) {
      if (!course.campus.includes(course.shifts[i].campus)) {
        course.shifts.splice(i, 1);
      }
    }
  }

  /* -----------------------------------------------------------
   * Remove shifts with types of classes not selected
   * ----------------------------------------------------------- */
  removeShiftsBasedOnTypesOfClasses(course: Course): void {
    if (this.typesOfClassesPicked.has(course.id)) {
      for (let i = course.shifts.length - 1; i >= 0; i--) {
        const shift = course.shifts[i];
        for (const type of shift.types) {
          if (!course.types.includes(type)) {
            course.shifts.splice(i, 1);
          }
        }
      }
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
    this.featuresHorizontal = window.innerWidth >= 1400 || (window.innerWidth >= 550 && window.innerWidth <= 767) ;
  }

}
