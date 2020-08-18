import {Component, Input, OnInit} from '@angular/core';

import {Subject} from './subject';

@Component({
  selector: 'app-subjects-banner',
  templateUrl: './subjects-banner.component.html',
  styleUrls: ['./subjects-banner.component.scss']
})
export class SubjectsBannerComponent implements OnInit {

  @Input() subjects: Subject[];

  constructor() { }

  ngOnInit(): void {
  }

}
