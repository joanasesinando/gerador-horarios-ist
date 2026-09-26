import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Course} from '../../_domain/Course/Course';
import {ClassType} from '../../_domain/ClassType/ClassType';

@Component({
  selector: 'app-course-banner',
  templateUrl: './courses-banner.component.html',
  styleUrls: ['./courses-banner.component.scss']
})
export class CoursesBannerComponent implements OnInit {

  @Input() courses: Course[];

  @Output() campusSelected = new EventEmitter<{courseID: number, campus: string}>();
  @Output() typesOfClassesSelected = new EventEmitter<{courseID: number, types: ClassType[]}>();
  @Output() removeBtn = new EventEmitter<number>();
  @Output() individualLessonsToggled = new EventEmitter<{courseID: number, type: ClassType, enabled: boolean}>();

  constructor() { }

  ngOnInit(): void {
  }

  campusPicked(campusSelected: {courseID: number, campus: string}): void {
    this.campusSelected.emit(campusSelected);
  }

  typesOfClassesPicked(typesSelected: {courseID: number, types: ClassType[]}): void {
    this.typesOfClassesSelected.emit(typesSelected);
  }

  individualLessonsPicked(event: {courseID: number, type: ClassType, enabled: boolean}): void {
    this.individualLessonsToggled.emit(event);
  }


  removeBtnClicked(courseID: number): void {
    this.removeBtn.emit(courseID);
  }

}
