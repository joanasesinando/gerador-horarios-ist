import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import _ from 'lodash';

import {LoggerService} from '../_util/logger.service';
import {Course} from '../_domain/Course/Course';
import {Degree} from '../_domain/Degree/Degree';
import {ClassType} from '../_domain/ClassType/ClassType';
import {isOlderThan} from '../_util/Time';

import {FenixService} from '../_services/fenix/fenix.service';
import {FirebaseService} from '../_services/firebase/firebase.service';
import {AlertService} from '../_util/alert.service';
import {ErrorService} from '../_util/error.service';
import {StateService} from '../_services/state/state.service';

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

declare let $;


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, AfterViewInit {

  mobileView = false;
  featuresHorizontal = false;
  noShiftsFound = false;

  academicTerms: string[] = [];
  degrees: Degree[] = [];
  courses: Course[] = [];

  selectedCourses: Course[] = [];
  selectedCoursesIDs = new Map<number, boolean>();
  campusPicked = new Map<number, string[]>();
  typesOfClassesPicked = new Map<number, ClassType[]>();

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
    private alertService: AlertService,
    private errorService: ErrorService,
    public stateService: StateService) {

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

    // Reset state if coming back
    if (this.stateService.hasStateSaved()) {
      this.resetState();
      this.spinners.loadingPage = false;
      return;
    }

    // Check if request for academic terms is taking too long
    let tookToLong = true;
    setTimeout(() => {
      if (tookToLong) {
        alertService.showAlert('Serviço indisponível', 'O gerador encontra-se em baixo. Por favor, tenta de novo daqui a uns minutos.', 'danger');
      }
    }, 15000);

    // Get academic terms
    this.fenixService.getAcademicTerms().then(academicTerms => {
      this.academicTerms = academicTerms;
      this.logger.log('academic terms', this.academicTerms);
      tookToLong = false;

      // Reset database if data is too old
      this.checkIfDatabaseIsOld();

      // Save state
      this.saveAcademicTermsState(this.academicTerms);

      this.academicTermFormControl.enable();
      this.spinners.academicTerm = false;
    });
    this.spinners.loadingPage = false;
  }

  ngOnInit(): void {
    this.onWindowResize();
  }

  ngAfterViewInit(): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  hasAcademicTermSelected(): boolean { return this.academicTermFormControl.value != null; }
  hasDegreeSelected(): boolean { return this.degreeFormControl.value != null; }
  hasCourseSelected(): boolean { return this.courseFormControl.value !== -1; }

  showScrollDown(): boolean {
    return this.mobileView && window.innerHeight > 590 && window.innerWidth <= 767;
  }

  checkIfDatabaseIsOld(): void {
    this.firebaseService.getLastTimeUpdatedTimestamp().then(timestamp => {
      const now = Date.now();
      if (isOlderThan(timestamp, now, 30)) {
        this.logger.log('Data is too old');
        this.firebaseService.cleanDatabase(this.academicTerms);
        this.firebaseService.updateLastTimeUpdatedTimestamp();
        this.logger.log('Database successfully cleaned');
      }
    });
  }

  resetState(): void {
    const academicTerm = this.stateService.academicTermSelected;
    const degreeID = this.stateService.degreeIDSelected;

    // Reset academic terms state
    this.academicTerms = this.stateService.academicTermsRepository;
    this.academicTermFormControl.patchValue(academicTerm);
    this.academicTermFormControl.enable();
    this.spinners.academicTerm = false;
    this.logger.log('has academic terms state saved', this.academicTerms);

    // Reset degrees state
    this.loadDegrees(academicTerm);
    this.degreeFormControl.patchValue(degreeID);

    // Reset courses state
    this.loadCoursesBasicInfo(academicTerm, degreeID);

    // Reset selected courses state
    for (const course of this.stateService.selectedCourses) {
      this.addCourse(course.id);
    }
  }

  saveAcademicTermsState(academicTerms: string[]): void {
    this.stateService.academicTermsRepository = _.cloneDeep(academicTerms);
    this.logger.log('saved academic terms state');
  }

  saveDegreesState(academicTerm: string, degrees: Degree[]): void {
    this.stateService.degreesRepository.set(academicTerm, _.cloneDeep(degrees));
    this.logger.log('saved degrees state');
  }

  saveCoursesState(academicTerm: string, degreeID: number, courses: Course[]): void {
    this.stateService.coursesRepository.has(academicTerm) ?
      this.stateService.coursesRepository.get(academicTerm).set(degreeID, _.cloneDeep(courses)) :
      this.stateService.coursesRepository.set(academicTerm, new Map<number, Course[]>().set(degreeID, _.cloneDeep(courses)));
    this.logger.log('saved courses state');
  }

  updateCourseState(academicTerm: string, degreeID: number, course: Course): void {
    const courses = this.stateService.coursesRepository.get(academicTerm).get(degreeID);
    const index = this.findCourseIndex(course.id, courses);
    courses[index] = course;
    this.stateService.coursesRepository.get(academicTerm).set(degreeID, _.cloneDeep(courses));
    this.logger.log('updated course state');
  }

  // TODO: same academic term; reset when picking different
  loadDegrees(academicTerm: string): Promise<void | Degree[]> | void {
    this.spinners.degree = true;

    // If state saved, don't call APIs
    if (this.stateService.degreesRepository.has(academicTerm)) {
      this.logger.log('has degrees state saved');
      this.degrees = this.stateService.degreesRepository.get(academicTerm)
        .sort((a, b) => a.acronym.localeCompare(b.acronym));
      this.degreeFormControl.enable();
      this.spinners.degree = false;
      this.logger.log('degrees', this.degrees);
      return;
    }

    return this.firebaseService.hasDegrees(academicTerm).then(has => {
      if (has) {
        this.logger.log('has degrees saved');
        this.firebaseService.getDegrees(academicTerm).then(degrees => {
          this.degrees = degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
          this.degreeFormControl.enable();
          this.spinners.degree = false;
          this.logger.log('degrees', this.degrees);

          // Save state
          this.saveDegreesState(academicTerm, this.degrees);
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
          if (error.found) {
            this.logger.log('error saving degrees to database:', error.type);

          } else {
            this.logger.log('degrees successfully saved to database');

            // Save state
            this.saveDegreesState(academicTerm, this.degrees);
          }
        });
      }
    });

  }

  loadCoursesBasicInfo(academicTerm: string, degreeID: number): Promise<void | Course[]> | void {
    this.spinners.course = true;

    // If state saved, don't call APIs
    if (this.stateService.coursesRepository.has(academicTerm)
      && this.stateService.coursesRepository.get(academicTerm).has(degreeID)) {

      this.logger.log('has courses state saved');
      this.courses = this.stateService.coursesRepository.get(academicTerm).get(degreeID)
        .sort((a, b) => a.acronym.localeCompare(b.acronym))
        .filter((course) => !this.selectedCoursesIDs.has(course.id));
      this.courseFormControl.enable();
      this.spinners.course = false;
      this.logger.log('courses', this.courses);
      return;
    }

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

          // Save state
          this.saveCoursesState(academicTerm, degreeID, this.courses);
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
          if (error.found) {
            this.logger.log('error saving courses to database:', error.type);
          } else {
            this.logger.log('courses successfully saved to database');

            // Save state
            this.saveCoursesState(academicTerm, degreeID, this.courses);
          }
        });
      }
    });
  }

  addCourse(courseID: number): void {
    const courseIndex = this.findCourseIndex(courseID, this.courses);
    const degreeIndex = this.findDegreeIndex(this.degreeFormControl.value, this.degrees);

    if (courseID && courseID !== -1 && courseIndex != null) {
      const addBtn = $('#addBtn');
      addBtn.attr('disabled', true);

      let courseToAdd = this.courses[courseIndex];
      courseToAdd.degree = this.degrees[degreeIndex];

      if (courseToAdd.hasFullInfo()) {
        this.addCourseHelper(courseToAdd, courseIndex, addBtn);

      } else {

        // Load rest of info
        this.spinners.course = true;
        this.fenixService.getMissingCourseInfo(courseToAdd).then(course => {
          courseToAdd = course;
          this.spinners.course = false;
          this.addCourseHelper(courseToAdd, courseIndex, addBtn);

          const academicTerm = this.academicTermFormControl.value;
          const degreeID = this.degreeFormControl.value;

          // Load to database
          if (course) {
            const error = {found: false, type: null};
            this.firebaseService.updateCourse(academicTerm, degreeID, courseToAdd)
              .catch((err) => { error.found = true; error.type = err; });
            if (error.found) {
              this.logger.log('error updating course in database:', error.type);
            } else {
              this.logger.log('course successfully updated in database');

              // Update state
              this.updateCourseState(academicTerm, degreeID, courseToAdd);
            }
          }
        });
      }
    }
  }

  addCourseHelper(course: Course, index: number, addBtn): void {
    if (course && course.shifts && course.shifts.length > 0) {
      // Update arrays
      this.selectedCourses.unshift(course);
      this.selectedCoursesIDs.set(course.id, true);
      this.courses.splice(index, 1);

      // Remove course from select
      $('#' + course.id).remove();

      // Reset select
      this.courseFormControl.patchValue(-1);

    } else {
      this.noShiftsFound = true;
      this.errorService.showError('No shifts found. Impossible to generate schedules for this course');
    }

    addBtn.attr('disabled', false);
    this.logger.log('selected courses', this.selectedCourses);
  }

  removeCourse(courseID: number): Promise<void> | null {
    const academicTerm = this.academicTermFormControl.value;
    const degreeID = this.degreeFormControl.value;
    const courseIndex = this.findCourseIndex(courseID, this.selectedCourses);

    // Course to remove is not selected
    if (courseIndex == null) { return null; }

    // Add back to select if same degree
    if (this.stateService.hasCourseInDegree(academicTerm, degreeID, courseID)) {
      const courseToRemove = this.selectedCourses[courseIndex];
      this.courses.push(courseToRemove);
      this.courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
    }

    remove(this.selectedCourses, this.selectedCoursesIDs, this.campusPicked, this.typesOfClassesPicked, this.logger);

    function remove(selectedCourses, selectedCoursesIDs, campusPicked, typesOfClassesPicked, logger): void {
      selectedCourses.splice(courseIndex, 1);
      selectedCoursesIDs.delete(courseID);
      campusPicked.delete(courseID);
      typesOfClassesPicked.delete(courseID);
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

  findDegreeIndex(degreeID: number, degrees: Degree[]): number {
    let index = 0;
    for (const degree of degrees) {
      if (degree.id === degreeID) { return index; }
      index++;
    }
    return null;
  }

  pickCourseCampus(selected: {courseID: number, campus: string}): void {
    this.campusPicked.set(selected.courseID, [selected.campus]);
  }

  pickTypesOfClasses(selected: {courseID: number, types: ClassType[]}): void {
    this.typesOfClassesPicked.set(selected.courseID, selected.types);
  }

  generateSchedules(): void {
    if (this.selectedCourses.length > 0) {
      // Save state
      this.stateService.academicTermSelected = this.academicTermFormControl.value;
      this.stateService.degreeIDSelected = this.degreeFormControl.value;
      this.stateService.selectedCourses = _.cloneDeep(this.selectedCourses);

      // Alter selected courses based on user choices
      this.prepareCoursesToGenerate();
      this.router.navigate(['/generate-schedules']);
    }
  }

  prepareCoursesToGenerate(): void {
    this.removeABDifferencesInShifts();
    this.renameShiftsWhenSameName();
    this.updateCampus();
    this.updateTypesOfClasses();

    for (const course of this.stateService.selectedCourses) {
      this.removeShiftsBasedOnCampus(course);
      this.removeShiftsBasedOnTypesOfClasses(course);
    }
  }

  /* -----------------------------------------------------------
   * [Patching - Covid-19 Social Distancing]
   * Updates courses so that A and B merges into one shift.
   * ----------------------------------------------------------- */
  removeABDifferencesInShifts(): void {
    for (const course of this.stateService.selectedCourses) {
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
   * Rename shifts when some have the same name
   * ----------------------------------------------------------- */
  renameShiftsWhenSameName(): void {
    const tempMap: Map<string, number> = new Map(); // shift.name --> index
    for (let i = 0; i < this.stateService.selectedCourses.length; i++) {
      const course = this.stateService.selectedCourses[i];

      for (let j = 0; j < course.shifts.length; j++) {
        const shift = course.shifts[j];

        if (tempMap.has(shift.name)) { shift.name = shift.name + '-' + i + j; }
        else { tempMap.set(shift.name, j); }
      }
    }
  }

  /* -----------------------------------------------------------
   * Update campus based on user choice
   * ----------------------------------------------------------- */
  updateCampus(): void {
    for (const key of this.campusPicked.keys()) {
      const index = this.findCourseIndex(key, this.stateService.selectedCourses);
      this.stateService.selectedCourses[index].campus = this.campusPicked.get(key);
    }
  }

  /* -----------------------------------------------------------
   * Update types of classes based on user choice
   * ----------------------------------------------------------- */
  updateTypesOfClasses(): void {
    for (const key of this.typesOfClassesPicked.keys()) {
      const index = this.findCourseIndex(key, this.stateService.selectedCourses);
      this.stateService.selectedCourses[index].types = this.typesOfClassesPicked.get(key);
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
