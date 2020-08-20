import {Component, HostListener, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';

import {Course} from './_domain/course';
import {Degree} from './_domain/degree';
import {FenixService} from './_services/fenix.service';
import {GenerateSchedulesService} from './_services/generate-schedules.service';

import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faCommentAlt, faChevronDown, faSmileBeam, faTh, faThumbtack, faQuestion} from '@fortawesome/free-solid-svg-icons';

declare let $;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gerador-horarios-ist';

  mobileView = false;
  featuresHorizontal = false;

  academicTerms: string[] = [];
  degrees: Degree[] = [];
  courses: Course[] = [];
  selectedCourses: Course[] = [];

  generateForm = new FormGroup({
    academicTerm: new FormControl({value: null, disabled: true}),
    degree: new FormControl({value: null, disabled: true}),
    course: new FormControl({value: null, disabled: true}),
  });

  get academicTermFormControl(): AbstractControl { return this.generateForm.get('academicTerm'); }
  get degreeFormControl(): AbstractControl { return this.generateForm.get('degree'); }
  get courseFormControl(): AbstractControl { return this.generateForm.get('course'); }

  academicTermsSpinner = true;
  degreesSpinner = false;
  coursesSpinner = false;

  // FontAwesome icons
  faGithub = faGithub;
  faCommentAlt = faCommentAlt;
  faChevronDown = faChevronDown;
  faSmileBeam = faSmileBeam;
  faThumbtack = faThumbtack;
  faTh = faTh;
  faQuestion = faQuestion;

  constructor(private fenixService: FenixService, private generateSchedulesService: GenerateSchedulesService) {
    this.fenixService.getAcademicTerms().then(academicTerms => {
      // @ts-ignore
      this.academicTerms = academicTerms;
      this.academicTermFormControl.enable();
      this.academicTermsSpinner = false;
    });
  }

  ngOnInit(): void {
    this.onWindowResize();

    $(() => {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }

  hasAcademicTermSelected(): boolean {
    // tslint:disable-next-line:triple-equals
    return this.academicTermFormControl.value != null;
  }

  hasDegreeSelected(): boolean {
    // tslint:disable-next-line:triple-equals
    return this.degreeFormControl.value != null;
  }

  hasCourseSelected(): boolean {
    // tslint:disable-next-line:triple-equals
    return this.courseFormControl.value != null;
  }

  loadDegrees(academicTerm: string): void {
    this.degreesSpinner = true;
    this.fenixService.getDegrees(academicTerm).then(degrees => {
      // @ts-ignore
      this.degrees = degrees;
      this.degreeFormControl.enable();
      this.degreesSpinner = false;
    });
  }

  loadCourses(academicTerm: string, courseId: string): void {
    console.log('Loading courses...');
    this.coursesSpinner = true;
    this.fenixService.getCourses(academicTerm, courseId).then(courses => {
      // @ts-ignore
      this.courses = courses;
      this.courseFormControl.enable();
      this.coursesSpinner = false;
      console.log('Loaded courses:');
      console.log(courses);
    });
  }

  addCourse(): void {
    // @ts-ignore
    const courseIndex = document.getElementById('inputCourse').value;

    // tslint:disable-next-line:triple-equals
    if (courseIndex && courseIndex != 'null') {
      const courseToAdd = this.courses[courseIndex];

      // update arrays
      this.selectedCourses.push(courseToAdd);
      this.courses.splice(courseIndex, 1);

      // remove course from select
      document.getElementById('course#' + courseIndex).remove();
    }

    console.log('Selected courses:'); // FIXME: remove
    console.log(this.selectedCourses); // FIXME: remove
  }

  removeCourse(index: number): void {
    const courseToRemove = this.selectedCourses[index];

    this.courses.push(courseToRemove);
    this.courses.sort((a, b) => a.name.localeCompare(b.name));
    this.selectedCourses.splice(index, 1);

    console.log('Selected courses:'); // FIXME: remove
    console.log(this.selectedCourses); // FIXME: remove
  }

  showScrollDown(): boolean {
    return this.mobileView && window.innerHeight > 590 && window.innerWidth <= 767;
  }

  generateSchedules(): void {
    if (this.selectedCourses.length > 0) {
      console.log('Generating...');
      // this.generateSchedulesService().generate();
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
    this.featuresHorizontal = window.innerWidth >= 1400 || (window.innerWidth >= 550 && window.innerWidth <= 767) ;
  }
}
