import {Component, HostListener, OnInit} from '@angular/core';
import {Subject} from './subjects-banner/subject';
import {SubjectsService} from './_services/subjects.service';

import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faCommentAlt, faChevronDown} from '@fortawesome/free-solid-svg-icons';

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

  subjects: Subject[];
  selectedSubjects: Subject[] = [];

  faGithub = faGithub;
  faCommentAlt = faCommentAlt;
  faChevronDown = faChevronDown;

  constructor(private subjectService: SubjectsService) {}

  ngOnInit(): void {
    this.onWindowResize();

    // FIXME: get subjects only after academic year and course selected
    this.subjects = this.getSubjects('fo', 'fo');

    $(() => {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }

  getSubjects(academicYear: string, course: string): Subject[] {
    return this.subjectService.getSubjects(academicYear, course);
  }

  addSubject(): void {
    // @ts-ignore
    const subjIndex = document.getElementById('inputSubject').value;

    // tslint:disable-next-line:triple-equals
    if (subjIndex && subjIndex != -1) {
      const subjToAdd = this.subjects[subjIndex];

      // update arrays
      this.selectedSubjects.push(subjToAdd);
      this.subjects.splice(subjIndex, 1);

      // remove subject from select
      document.getElementById('subj#' + subjIndex).remove();
    }

    console.log(this.selectedSubjects); // FIXME: remove
  }

  removeSubject(index: number): void {
    const subjToRemove = this.selectedSubjects[index];

    this.subjects.push(subjToRemove);
    this.subjects.sort((a, b) => a.name.localeCompare(b.name));
    this.selectedSubjects.splice(index, 1);

    console.log(this.selectedSubjects); // FIXME: remove
  }

  showScrollDown(): boolean {
    return this.mobileView && window.innerHeight > 590 && window.innerWidth <= 767;
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
    this.featuresHorizontal = window.innerWidth >= 1400 || (window.innerWidth >= 550 && window.innerWidth <= 767) ;
  }
}
