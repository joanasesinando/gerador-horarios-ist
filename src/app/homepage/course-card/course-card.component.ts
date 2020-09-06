import {Component, Input, OnInit, Output, EventEmitter, AfterViewInit} from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import {Course} from '../../_domain/Course';

declare let $;

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss']
})
export class CourseCardComponent implements AfterViewInit {

  @Input() index: number;
  @Input() course: Course;

  @Output() campusSelected = new EventEmitter<{index: number, data: string}>();
  @Output() typesOfClassesSelected = new EventEmitter<{index: number, data: string[]}>();
  @Output() removeBtn = new EventEmitter<number>();

  faTimes = faTimes;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.campusPicked(this.course);
    this.typesOfClassesPicked(this.course);
    // FIXME: get what's checked properly (error: multiple courses selected
  }

  campusPicked(course): void {
    const radioBtns = $('input[name^=radioCampus-' + course.name.replaceAll(' ', '') + ']');
    for (const btn of radioBtns) {
      if (btn.checked) {
        this.campusSelected.emit({index: this.index, data: btn.labels[0].innerText});
      }
    }
  }

  typesOfClassesPicked(course): void {
    const checkboxes = $('input[name^=checkTypeClass-' + course.name.replaceAll(' ', '') + ']');
    const checked: string[] = [];
    for (const box of checkboxes) {
      if (box.checked) {
        checked.push(box.labels[0].innerText);
      }
    }
    this.typesOfClassesSelected.emit({index: this.index, data: checked});
  }

  removeBtnClicked(): void {
    this.removeBtn.emit(this.index);
  }

}
