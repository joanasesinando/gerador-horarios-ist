import {Component, HostListener, OnInit} from '@angular/core';
import {Course, Degree} from './_model/course';
import {FenixService} from './_services/fenix.service';

import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faCommentAlt, faChevronDown, faSmileBeam, faThLarge, faThumbtack, faQuestion} from '@fortawesome/free-solid-svg-icons';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';

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

  academicYears: string[] = [];
  degrees: Degree[] = [];
  courses: Course[] = [];
  selectedCourses: Course[] = [];

  generateForm = new FormGroup({
    academicYear: new FormControl({value: null, disabled: true}),
    degree: new FormControl({value: null, disabled: true}),
    course: new FormControl({value: null, disabled: true}),
  });

  get academicYearFormControl(): AbstractControl { return this.generateForm.get('academicYear'); }
  get degreeFormControl(): AbstractControl { return this.generateForm.get('degree'); }
  get courseFormControl(): AbstractControl { return this.generateForm.get('course'); }

  academicYearsSpinner = true;
  degreesSpinner = false;
  coursesSpinner = false;

  // FontAwesome icons
  faGithub = faGithub;
  faCommentAlt = faCommentAlt;
  faChevronDown = faChevronDown;
  faSmileBeam = faSmileBeam;
  faThumbtack = faThumbtack;
  faThLarge = faThLarge;
  faQuestion = faQuestion;

  constructor(private fenixService: FenixService) {
    this.fenixService.getAcademicYears().then(academicYears => {
      // @ts-ignore
      this.academicYears = academicYears;
      this.academicYearFormControl.enable();
      this.academicYearsSpinner = false;
    });
  }

  ngOnInit(): void {
    this.onWindowResize();

    $(() => {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }

  hasAcademicYearSelected(): boolean {
    // tslint:disable-next-line:triple-equals
    return this.academicYearFormControl.value != null;
  }

  hasDegreeSelected(): boolean {
    // tslint:disable-next-line:triple-equals
    return this.degreeFormControl.value != null;
  }

  hasCourseSelected(): boolean {
    // tslint:disable-next-line:triple-equals
    return this.courseFormControl.value != null;
  }

  loadDegrees(academicYear: string): void {
    this.degreesSpinner = true;
    this.fenixService.getDegrees(academicYear).then(degrees => {
      // @ts-ignore
      this.degrees = degrees;
      this.degreeFormControl.enable();
      this.degreesSpinner = false;
    });
  }

  loadCourses(academicYear: string, courseId: string): void {
    console.log('Loading courses...');
    this.coursesSpinner = true;
    this.fenixService.getCourses(academicYear, courseId).then(courses => {
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
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
    this.featuresHorizontal = window.innerWidth >= 1400 || (window.innerWidth >= 550 && window.innerWidth <= 767) ;
  }
}
