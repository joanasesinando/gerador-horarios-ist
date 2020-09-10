import {Component, Input, Output, EventEmitter, AfterViewInit} from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import {Course} from '../../_domain/Course';

declare let $;

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss']
})
export class CourseCardComponent implements AfterViewInit {

  @Input() course: Course;

  @Output() campusSelected = new EventEmitter<{courseID: number, campus: string}>();
  @Output() typesOfClassesSelected = new EventEmitter<{courseID: number, types: string[]}>();
  @Output() removeBtn = new EventEmitter<number>();

  faTimes = faTimes;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.campusPicked(this.course);
  }

  formatName(name: string): string {
    // @ts-ignore
    return name.replaceAll(/[ ,]/g, '');
  }

  campusPicked(course): void {
    const radioBtns = $('input[name^=radioCampus-' + this.formatName(course.name) + ']');
    for (const btn of radioBtns) {
      if (btn.checked) {
        this.campusSelected.emit({courseID: course.id, campus: btn.labels[0].innerText});
      }
    }
  }

  typesOfClassesPicked(course): void {
    const checkboxes = $('input[name^=checkTypeClass-' + this.formatName(course.name) + ']');
    const typesChecked: string[] = [];
    for (const box of checkboxes) {
      if (box.checked) {
        typesChecked.push(box.labels[0].innerText);
      }
    }
    this.typesOfClassesSelected.emit({courseID: course.id, types: typesChecked});
  }

  removeBtnClicked(): void {
    this.removeBtn.emit(this.course.id);
  }

}
