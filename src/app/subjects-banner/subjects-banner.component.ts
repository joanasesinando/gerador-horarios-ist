import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';

import {Subject} from './subject';

@Component({
  selector: 'app-subjects-banner',
  templateUrl: './subjects-banner.component.html',
  styleUrls: ['./subjects-banner.component.scss']
})
export class SubjectsBannerComponent implements OnInit {

  @Input() subjects: Subject[];

  @Output() removeBtn = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  removeBtnClicked(index: number): void {
    this.removeBtn.emit(index);
  }

}
