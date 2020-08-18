import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss']
})
export class SubjectCardComponent implements OnInit {

  @Input() index: number;
  @Input() name: string;
  @Input() classesTypes: string[];

  @Output() removeBtn = new EventEmitter<number>();

  faTimes = faTimes;

  constructor() { }

  ngOnInit(): void {
  }

  removeBtnClicked(): void {
    this.removeBtn.emit(this.index);
  }

}
