import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {environment} from '../../environments/environment';
import _ from 'lodash';

import {LoggerService} from '../_util/logger.service';
import {Course} from '../_domain/Course/Course';
import {Degree} from '../_domain/Degree/Degree';
import {ClassType} from '../_domain/ClassType/ClassType';

import {FenixService} from '../_services/fenix/fenix.service';
import {AlertService} from '../_util/alert.service';
import {StateService} from '../_services/state/state.service';

import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {
  faBolt,
  faChevronDown,
  faCommentAlt,
  faFileExport,
  faGlobeEurope,
  faQuestion,
  faTh,
  faThumbtack
} from '@fortawesome/free-solid-svg-icons';

declare let $;


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, AfterViewInit {

  projectVersion: string = environment.projectVersion;

  mobileView = false;
  featuresHorizontal = false;

  academicTerms: string[] = [];
  degrees: Degree[] = [];
  courses: Course[] = [];

  selectedAcademicTerm: string;
  selectedDegree: number;
  selectedCourse: number;

  selectedCourses: Course[] = [];
  selectedCoursesIDs = new Map<number, boolean>();
  totalCredits = 0;

  campusPicked = new Map<number, string[]>();
  typesOfClassesPicked = new Map<number, ClassType[]>();

  spinners = {
    academicTerm: true,
    degree: false,
    course: false,
    loadingPage: false
  };

  noShiftsFound = false;

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
    private router: Router,
    private alertService: AlertService,
    public stateService: StateService) {

    this.spinners.loadingPage = true;

    // Translation
    translateService.addLangs(['pt-PT', 'en-GB']);
    translateService.setDefaultLang('pt-PT');
    const browserLang = translateService.getBrowserLang();
    translateService.use(browserLang.match(/pt-PT|en-GB/) ? browserLang : 'pt-PT');

    // Selects translation subscription
    this.translateService.stream('main-content.labels.placeholder').subscribe(value => {
      translateSelect('inputAcademicTerm', value, 'main-content.labels.term', this.translateService);
      translateSelect('inputDegree', value, 'main-content.labels.degree', this.translateService);
      translateSelect('inputCourse', value, 'main-content.labels.course', this.translateService);
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
        translateService.currentLang === 'pt-PT' ?
          alertService.showAlert('Serviço indisponível', 'O gerador encontra-se em baixo. Por favor, tenta de novo daqui a uns minutos.', 'danger') :
          alertService.showAlert('Unavailable service', 'The generator is down. Please try again later.', 'danger');
      }
    }, 15000);

    // Get academic terms
    this.fenixService.getAcademicTerms().then(academicTerms => {
      this.academicTerms = academicTerms;
      setTimeout(() => $('#inputAcademicTerm').selectpicker('refresh'), 0);
      this.logger.log('academic terms', this.academicTerms);
      this.spinners.academicTerm = false;
      tookToLong = false;

      // Save state
      this.stateService.saveAcademicTermsState(this.academicTerms);
    });
    this.spinners.loadingPage = false;

    function translateSelect(selectID: string, value: string, translationKey: string, service: TranslateService): void {
      const select = $('#' + selectID);
      select.attr('title', value + ' ' + service.instant(translationKey).toLowerCase() + '...');
      select.selectpicker('destroy');
      select.selectpicker();
    }
  }

  ngOnInit(): void {
    this.onWindowResize();
  }

  async ngAfterViewInit(): Promise<void> {
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

    $('[data-toggle="tooltip"]').tooltip();
  }

  showScrollDown(): boolean {
    return this.mobileView && window.innerHeight > 590 && window.innerWidth <= 767;
  }

  async changeLanguage(lang: string): Promise<void> {
    this.translateService.use(lang);

    // Reset
    this.selectedAcademicTerm = null;
    this.selectedDegree = null;
    this.selectedCourse = null;

    this.degrees = [];
    this.courses = [];
    this.selectedCourses = [];

    this.selectedCoursesIDs.clear();
    this.campusPicked.clear();
    this.typesOfClassesPicked.clear();

    // Clean selected courses
    for (const course of this.selectedCourses)
      this.removeCourse(course.id);

    // Reset state
    this.stateService.academicTermSelected = null;
    this.stateService.degreeIDSelected = null;
    this.stateService.degreesRepository = new Map<string, Degree[]>();
    this.stateService.coursesRepository = new Map<string, Map<number, Course[]>>();
    this.stateService.selectedCourses = null;
  }

  resetState(): void {
    const academicTerm = this.stateService.academicTermSelected;
    const degreeID = this.stateService.degreeIDSelected;

    // Reset language
    this.translateService.use(this.stateService.selectedLanguage);

    // Reset academic terms state
    this.academicTerms = this.stateService.academicTermsRepository;
    this.selectedAcademicTerm = academicTerm;
    this.spinners.academicTerm = false;
    this.logger.log('has academic terms state saved', this.academicTerms);

    // Reset degrees state
    this.loadDegrees(academicTerm);
    this.selectedDegree = degreeID;

    // Reset courses state
    this.loadCoursesBasicInfo(academicTerm, degreeID);

    // Reset selected courses state
    for (const course of this.stateService.selectedCourses) {
      this.addCourse(course.id);
    }

    // Reset selects
    setTimeout(() => {
      $('#inputAcademicTerm').selectpicker();
      $('#inputAcademicTerm').selectpicker('val', this.selectedAcademicTerm);
      $('#inputDegree').selectpicker();
      $('#inputCourse').selectpicker();
    }, 0);
  }

  async loadDegrees(academicTerm: string): Promise<void> {
    this.spinners.degree = true;
    this.selectedDegree = null;
    this.selectedCourse = null;

    // If state saved, don't call APIs
    if (this.stateService.degreesRepository.has(academicTerm)) {
      this.logger.log('has degrees state saved');
      this.degrees = this.stateService.degreesRepository.get(academicTerm)
        .sort((a, b) => a.acronym.localeCompare(b.acronym));

    } else {
      this.logger.log('no degrees state found');
      this.degrees = await this.fenixService.getDegrees(academicTerm);
      this.stateService.saveDegreesState(academicTerm, this.degrees);
    }

    this.refreshSelectAndMaintainPosition('inputDegree');

    this.spinners.degree = false;
    this.logger.log('degrees', this.degrees);
  }

  getDegressByType(type: string): Degree[] {
    if (type === 'bachelor') return this.degrees.filter(degree => this.translateService.currentLang === 'pt-PT' ?
      degree.name.toLowerCase().includes('licenciatura') : degree.name.toLowerCase().includes('bologna degree'));

    if (type === 'master') return this.degrees.filter(degree => this.translateService.currentLang === 'pt-PT' ?
      degree.name.toLowerCase().includes('mestrado') : degree.name.toLowerCase().includes('master'));

    if (type === 'minor') return this.degrees.filter(degree => degree.name.toLowerCase().includes('minor'));

    if (type === 'advanced-studies') return this.degrees.filter(degree => degree.name.toLowerCase().includes('diploma'));

    if (type === 'hacs') return this.degrees.filter(degree => degree.acronym.toLowerCase().includes('hacs'));

    return this.degrees;
  }

  async loadCoursesBasicInfo(academicTerm: string, degreeID: number): Promise<void> {
    this.spinners.course = true;
    this.selectedCourse = null;

    // If state saved, don't call APIs
    if (this.stateService.coursesRepository.has(academicTerm)
      && this.stateService.coursesRepository.get(academicTerm).has(degreeID)) {

      this.logger.log('has courses state saved');
      this.courses = this.stateService.coursesRepository.get(academicTerm).get(degreeID)
        .sort((a, b) => a.acronym.localeCompare(b.acronym))
        .filter((course) => !this.selectedCoursesIDs.has(course.id));

    } else {
      this.logger.log('no courses found');
      this.courses = (await this.fenixService.getCoursesBasicInfo(academicTerm, degreeID))
        .filter((course) => !this.selectedCoursesIDs.has(course.id));
      this.stateService.saveCoursesState(academicTerm, degreeID, this.courses);
    }

    this.refreshSelectAndMaintainPosition('inputCourse');

    this.spinners.course = false;
    this.logger.log('courses', this.courses);
  }

  getCoursesBySemester(semester: number): Course[] {
    if (semester === 0)
      return this.courses.filter(course => course.semester !== 1 && course.semester !== 2);

    return this.courses.filter(course => course.semester === semester);
  }

  addCourse(courseID): void {
    const courseIndex = this.findCourseIndex(courseID, this.courses);
    const degreeIndex = this.findDegreeIndex(this.selectedDegree, this.degrees);

    if (courseID && courseID !== -1 && courseIndex != null) {
      const addBtn = $('#addBtn');
      addBtn.attr('disabled', true);

      let courseToAdd = _.cloneDeep(this.courses[courseIndex]) as Course;
      courseToAdd.degree = this.degrees[degreeIndex];

      if (!this.isSameSemester(courseToAdd)) {
        this.translateService.currentLang === 'pt-PT' ?
          this.alertService.showAlert('Atenção', 'Esta cadeira é lecionada num semestre diferente das cadeiras que já foram selecionadas.', 'warning') :
          this.alertService.showAlert('Attention', 'This course is taught in a different semester than the courses already added.', 'warning');
        addBtn.attr('disabled', false);
        return;
      }

      if (!this.isSamePeriod(courseToAdd)) {
        this.translateService.currentLang === 'pt-PT' ?
          this.alertService.showAlert('Atenção', 'Esta cadeira é lecionada num período diferente das cadeiras que já foram selecionadas.', 'warning') :
          this.alertService.showAlert('Attention', 'This course is taught in a different term than the courses already added.', 'warning');
        addBtn.attr('disabled', false);
        return;
      }

      if (courseToAdd.hasFullInfo()) {
        this.addCourseHelper(courseToAdd, courseIndex, addBtn);

      } else {

        // Load rest of info
        this.spinners.course = true;
        this.fenixService.getMissingCourseInfo(this.selectedAcademicTerm, courseToAdd).then(course => {
          if (!course) {
            this.spinners.course = false;
            addBtn.attr('disabled', false);
            this.noShiftsFound = true;
            return;
          }
          courseToAdd = course;

          this.spinners.course = false;
          this.addCourseHelper(courseToAdd, courseIndex, addBtn);
        });
      }
    }
  }

  addCourseHelper(course: Course, index: number, addBtn): void {
    // Update arrays
    this.selectedCourses.unshift(course);
    this.selectedCoursesIDs.set(course.id, true);
    this.courses.splice(index, 1);

    // Update total credits
    this.totalCredits += course.credits;

    // Update select
    this.refreshSelectAndMaintainPosition('inputCourse');
    this.selectedCourse = null;

    addBtn.attr('disabled', false);
    this.logger.log('selected courses', this.selectedCourses);
  }

  isSameSemester(course: Course): boolean {
    for (const c of this.selectedCourses) {
      if (c.semester !== course.semester) return false;
    }
    return true;
  }

  isSamePeriod(course: Course): boolean {
    for (const c of this.selectedCourses) {
      if (c.period !== course.period && c.period && course.period) return false;
    }
    return true;
  }

  removeCourse(courseID: number): Promise<void> | null {
    const academicTerm = this.selectedAcademicTerm;
    const degreeID = this.selectedDegree;
    const courseIndex = this.findCourseIndex(courseID, this.selectedCourses);

    // Course to remove is not selected
    if (courseIndex == null) { return null; }

    // Add back to select if same degree
    if (this.stateService.hasCourseInDegree(academicTerm, degreeID, courseID)) {
      const courseToRemove = this.selectedCourses[courseIndex];
      this.courses.push(courseToRemove);
      this.courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      this.refreshSelectAndMaintainPosition('inputCourse');
    }

    this.totalCredits -= this.selectedCourses[courseIndex].credits;
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
      // tslint:disable-next-line:triple-equals
      if (course.id == courseID) return index;
      index++;
    }
    return null;
  }

  findDegreeIndex(degreeID: number, degrees: Degree[]): number {
    let index = 0;
    for (const degree of degrees) {
      // tslint:disable-next-line:triple-equals
      if (degree.id == degreeID) { return index; }
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
      this.stateService.academicTermSelected = this.selectedAcademicTerm;
      this.stateService.degreeIDSelected = this.selectedDegree;
      this.stateService.selectedCourses = _.cloneDeep(this.selectedCourses);
      this.stateService.selectedLanguage = this.translateService.currentLang;

      // Alter selected courses based on user choices
      this.prepareCoursesToGenerate();
      this.router.navigate(['/generate-schedules']);
    }
  }

  prepareCoursesToGenerate(): void {
    this.removeDuplicatedShifts();
    this.updateCampus();
    this.updateTypesOfClasses();

    for (const course of this.stateService.selectedCourses) {
      if (course.campus) this.removeShiftsBasedOnCampus(course);
      this.removeShiftsBasedOnTypesOfClasses(course);
    }
  }

  /* -----------------------------------------------------------
   * Remove shifts that are equal. Rename shifts when they only
   * share the same name
   * ----------------------------------------------------------- */
  removeDuplicatedShifts(): void {
    for (let i = 0; i < this.stateService.selectedCourses.length; i++) {
      const course = this.stateService.selectedCourses[i];

      for (let j = 0; j <= course.shifts.length - 2; j++) {
        const shift = course.shifts[j];

        for (let k = course.shifts.length - 1; k >= j + 1; k--) {
          const otherShift = course.shifts[k];
          if (shift.equal(otherShift)) {
            course.shifts.splice(k, 1);
          }

          else if (shift.name === otherShift.name)
            otherShift.name = shift.name + '-' + i + j;
        }
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

  removePortugueseCharacters(s: string): string {
    return s.replaceAll(/[ãáâà]/ig, 'a')
            .replaceAll(/[óôõ]/ig, 'o')
            .replaceAll(/ç/ig, 'c')
            .replaceAll(/[éê]/ig, 'e')
            .replaceAll(/í/ig, 'i')
            .replaceAll(/ú/ig, 'u');
  }

  isMEPPAcademicTerm(): boolean {
    return this.fenixService.isMEPPAcademicTerm(this.selectedAcademicTerm);
  }

  refreshSelectAndMaintainPosition(selectID: string): void {
    const select = $('#' + selectID);
    const position = document.documentElement.scrollTop || document.body.scrollTop;
    const html = $('html');

    setTimeout(() => {
      // Refresh select
      select.selectpicker('refresh');

      // Prevent page from jumping
      html.css('scroll-behavior', 'unset');
      document.documentElement.scrollTop = document.body.scrollTop = position;
      html.css('scroll-behavior', 'smooth');
    }, 0);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
    this.featuresHorizontal = window.innerWidth >= 1400 || (window.innerWidth >= 550 && window.innerWidth <= 767) ;
  }

}
