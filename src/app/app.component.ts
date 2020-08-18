import {Component, OnInit} from '@angular/core';
import {Subject} from './subjects-banner/subject';
import {SubjectsService} from './_services/subjects.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gerador-horarios-ist';

  subjects: Subject[];
  selectedSubjects: Subject[] = [];

  constructor(private subjectService: SubjectsService) {}

  ngOnInit(): void {
    // FIXME: get subjects only after academic year and course selected
    this.subjects = this.getSubjects('fo', 'fo');
  }

  getSubjects(academicYear: string, course: string): Subject[] {
    return this.subjectService.getSubjects(academicYear, course);
  }

  addSubject(): void {
    // @ts-ignore
    const subjIndex = document.getElementById('inputSubject').value;

    if (subjIndex) {
      const subjToAdd = this.subjects[subjIndex];

      // update arrays
      this.selectedSubjects.push(subjToAdd);
      this.subjects.splice(subjIndex, 1);

      // remove subject from select
      document.getElementById('subj#' + subjIndex).remove();
    }

    console.log(this.selectedSubjects);
  }
}
