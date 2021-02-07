import {Component, Input, Output, EventEmitter, AfterViewInit} from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import {Course} from '../../_domain/Course/Course';
import {ClassType} from '../../_domain/ClassType/ClassType';
import {Degree} from '../../_domain/Degree/Degree';

declare let $;

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss']
})
export class CourseCardComponent implements AfterViewInit {

  @Input() course: Course;

  @Output() campusSelected = new EventEmitter<{courseID: number, campus: string}>();
  @Output() typesOfClassesSelected = new EventEmitter<{courseID: number, types: ClassType[]}>();
  @Output() removeBtn = new EventEmitter<number>();

  faTimes = faTimes;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.campusPicked(this.course);
  }

  formatName(name: string): string {
    return name.replace(/[ ,]/g, '');
  }

  hasDefaultCampus(degree: Degree): boolean {
    switch (degree.acronym) {
      case 'LEIC-A':
      case 'LEIC-T':
      case 'MEIC-A':
      case 'MEIC-T':
        return true;

      default:
        return false;
    }
  }

  setCampusBasedOnDefault(degree: Degree, campus: string): boolean {
    switch (degree.acronym) {
      case 'LEIC-A':
      case 'MEIC-A':
        return campus === 'Alameda';

      case 'LEIC-T':
      case 'MEIC-T':
        return campus === 'Taguspark';
    }
  }

  campusPicked(course): void {
    const radioBtns = $('input[name^=radioCampus-' + this.formatName(course.acronym) + ']');
    for (const btn of radioBtns) {
      if (btn.checked)
        this.campusSelected.emit({courseID: course.id, campus: btn.labels[0].innerText});
    }
  }

  typesOfClassesPicked(course): void {
    const checkboxes = $('input[name^=checkTypeClass-' + this.formatName(course.acronym) + ']');
    const typesChecked: ClassType[] = [];
    for (const box of checkboxes) {
      if (box.checked) typesChecked.push(box.labels[0].innerText);
    }
    this.typesOfClassesSelected.emit({courseID: course.id, types: typesChecked});
  }

  removeBtnClicked(): void {
    this.removeBtn.emit(this.course.id);
  }

}
