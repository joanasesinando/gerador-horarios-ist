import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss']
})
export class CourseCardComponent implements OnInit {

  @Input() index: number;
  @Input() name: string;
  @Input() acronym: string;
  @Input() types: string[];

  @Output() removeBtn = new EventEmitter<number>();

  faTimes = faTimes;

  constructor() { }

  ngOnInit(): void {
  }

  removeBtnClicked(): void {
    this.removeBtn.emit(this.index);
  }

}
