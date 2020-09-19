import {Component, HostListener, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import _ from 'lodash';

import {LoggerService} from '../_util/logger.service';
import {Course, parseCourses} from '../_domain/Course';
import {Degree} from '../_domain/Degree';

import {FenixService} from '../_services/fenix.service';
import {FirebaseService} from '../_services/firebase.service';

import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {
  faCommentAlt,
  faChevronDown,
  faTh,
  faThumbtack,
  faFileExport,
  faQuestion,
  faGlobeEurope,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import {of} from 'rxjs';
import {AlertService} from '../_util/alert.service';

declare let $;


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  mobileView = false;
  featuresHorizontal = false;
  noShiftsFound = false;

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
    course: false,
    loadingPage: false
  };

  // FontAwesome icons
  faGithub = faGithub;
  faCommentAlt = faCommentAlt;
  faChevronDown = faChevronDown;
  faThumbtack = faThumbtack;
  faTh = faTh;
  faFileExport = faFileExport;
  faQuestion = faQuestion;
  faGlobeEurope = faGlobeEurope;
  faBolt = faBolt;

  constructor(
    private logger: LoggerService,
    private fenixService: FenixService,
    public translateService: TranslateService,
    public firebaseService: FirebaseService,
    private router: Router,
    private alertService: AlertService) {

    this.spinners.loadingPage = true;

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

    // Initialization for resetting state
    let data: {
      originalCourses: {_id, _name, _acronym, _types, _campus, _shifts, _courseLoads}[],
      academicTerm: string,
      degreeID: number
    };
    if (history.state) {
      data = history.state.data;
      if (!data) { this.spinners.loadingPage = false; }
    }

    // Check if request for academic terms is taking too long
    let tookToLong = true;
    setTimeout(() => {
      if (tookToLong) {
        alertService.showAlert('Serviço indisponível', 'O gerador encontra-se em baixo. Por favor, tenta de novo daqui a 10min.', 'danger');
      }
    }, 10000);

    // Get academic terms
    // TODO: only show current and next (API about)
    this.fenixService.getAcademicTerms().then(academicTerms => {
      this.academicTerms = academicTerms;
      this.academicTermFormControl.enable();
      this.spinners.academicTerm = false;
      this.logger.log('academic terms', this.academicTerms);
      tookToLong = false;

      // Reset state if coming back
      // TODO: put into function
      if (data) {
        this.resetState(data);
      }
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

  resetState(data: { originalCourses: {_id, _name, _acronym, _types, _campus, _shifts, _courseLoads}[],
      academicTerm: string, degreeID: number }): void {

    this.selectedCourses = parseCourses(data.originalCourses);
    this.selectedCoursesIDs.clear();
    for (const course of this.selectedCourses) {
      this.selectedCoursesIDs.set(course.id, true);
    }

    this.academicTermFormControl.patchValue(data.academicTerm);
    this.loadDegrees(data.academicTerm).then(() => {
      this.degreeFormControl.patchValue(data.degreeID);
      this.loadCoursesBasicInfo(data.academicTerm, data.degreeID).then(() => {
        this.spinners.loadingPage = false;
      });
    });
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
    this.noShiftsFound = false;
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
          if (course) {
            const error = {found: false, type: null};
            const academicTerm = $('#inputAcademicTerm').val();
            const degreeId = $('#inputDegree').val();
            this.firebaseService.updateCourse(academicTerm, degreeId, courseToAdd)
              .catch((err) => { error.found = true; error.type = err; });
            error.found ? this.logger.log('error saving courses:', error.type) : this.logger.log('course successfully updated');
          }
        });
      }
    }
  }

  addCourseHelper(course, index, addBtn): void {
    if (course) {
      // Update arrays
      this.selectedCourses.unshift(course);
      this.selectedCoursesIDs.set(course.id, true);
      this.courses.splice(index, 1);

      // Remove course from select
      $('#' + course.id).remove();

      // Reset select
      this.courseFormControl.patchValue(-1);

    } else { this.noShiftsFound = true; }

    addBtn.attr('disabled', false);
    this.logger.log('selected courses', this.selectedCourses);
  }

  removeCourse(courseID: number): Promise<void> | Promise<null> {
    const academicTerm = this.academicTermFormControl.value;
    const degreeID = this.degreeFormControl.value;
    const courseIndex = this.findCourseIndex(courseID, this.selectedCourses);

    // Course to remove is not selected
    if (courseIndex == null) { return of(null).toPromise(); }

    // If coming back from generation empty
    if (!academicTerm || !degreeID) {
      remove(this.selectedCourses, this.selectedCoursesIDs, this.logger);
      return;
    }

    return this.firebaseService.hasCourseInDegree(academicTerm, degreeID, courseID).then(has => {
      // Add back to select if same degree
      if (has) {
        const courseToRemove = this.selectedCourses[courseIndex];
        this.courses.push(courseToRemove);
        this.courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      }

      remove(this.selectedCourses, this.selectedCoursesIDs, this.logger);
    });

    function remove(selectedCourses, selectedCoursesIDs, logger): void {
      selectedCourses.splice(courseIndex, 1);
      selectedCoursesIDs.delete(courseID);
      logger.log('selected courses', selectedCourses);
    }
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
      // Save original unaltered selected courses
      const originalCourses = _.cloneDeep(this.selectedCourses);

      // Alter selected courses based on user choices & send
      this.prepareCoursesToGenerate();
      this.router.navigate(['/generate-schedules'],
        {
          state: {
            data: {
              originalCourses,
              selectedCourses: this.selectedCourses,
              academicTerm: this.academicTermFormControl.value,
              degreeID: this.degreeFormControl.value
            }
          }
        });
    }
  }

  prepareCoursesToGenerate(): void {
    this.removeABDifferencesInShifts();
    this.updateCampus();
    this.updateTypesOfClasses();

    for (const course of this.selectedCourses) {
      this.removeShiftsBasedOnCampus(course);
      this.removeShiftsBasedOnTypesOfClasses(course);
    }
  }

  /* -----------------------------------------------------------
   * [Patching - Covid-19 Social Distancing]
   * Updates courses so that A and B merges into one shift.
   * ----------------------------------------------------------- */
  removeABDifferencesInShifts(): void {
    for (const course of this.selectedCourses) {
      for (let i = course.shifts.length - 1; i >= 0; i--) {
        const shift = course.shifts[i];

        // Keep As & remove Bs
        if (shift.name.startsWith('a_')) {
          shift.name = shift.name.substring(2);

        } else if (shift.name.startsWith('b_')) {
          course.shifts.splice(i, 1);
        }
      }
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
        if (!course.types.includes(shift.type)) {
          course.shifts.splice(i, 1);
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
