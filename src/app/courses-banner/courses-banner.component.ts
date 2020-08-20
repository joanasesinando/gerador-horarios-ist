import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';

import {Course} from '../_model/course';

@Component({
  selector: 'app-course-banner',
  templateUrl: './courses-banner.component.html',
  styleUrls: ['./courses-banner.component.scss']
})
export class CoursesBannerComponent implements OnInit {

  @Input() courses: Course[];

  @Output() removeBtn = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  removeBtnClicked(index: number): void {
    this.removeBtn.emit(index);
  }

}
