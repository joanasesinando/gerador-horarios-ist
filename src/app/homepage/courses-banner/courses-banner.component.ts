import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Course} from '../../_domain/Course';

@Component({
  selector: 'app-course-banner',
  templateUrl: './courses-banner.component.html',
  styleUrls: ['./courses-banner.component.scss']
})
export class CoursesBannerComponent implements OnInit {

  @Input() courses: Course[];

  @Output() campusSelected = new EventEmitter<{courseID: number, campus: string}>();
  @Output() typesOfClassesSelected = new EventEmitter<{courseID: number, types: string[]}>();
  @Output() removeBtn = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  campusPicked(campusSelected: {courseID: number, campus: string}): void {
    this.campusSelected.emit(campusSelected);
  }

  typesOfClassesPicked(typesSelected: {courseID: number, types: string[]}): void {
    this.typesOfClassesSelected.emit(typesSelected);
  }

  removeBtnClicked(courseID: number): void {
    this.removeBtn.emit(courseID);
  }

}
