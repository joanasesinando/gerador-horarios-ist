import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

import { faCaretDown, faCaretUp, faTimes } from '@fortawesome/free-solid-svg-icons';

import { Schedule } from '../../_domain/Schedule';
import {ClassType, minifyClassType} from '../../_domain/ClassType';

import {TranslateService} from '@ngx-translate/core';

declare let $;

@Component({
  selector: 'app-schedule-card',
  templateUrl: './schedule-card.component.html',
  styleUrls: ['./schedule-card.component.scss']
})
export class ScheduleCardComponent implements OnInit {

  @Input() schedule: Schedule;
  @Output() removeBtn = new EventEmitter<number>();

  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;
  faTimes = faTimes;

  expanded = false;
  mobileView = false;

  constructor(public translateService: TranslateService) { }

  ngOnInit(): void {
    this.onWindowResize();
  }

  toggle(): void {
   const expanded = $('.wrapper').attr('aria-expanded');
   this.expanded = expanded !== 'true';
  }

  minifyClassType(type: ClassType): string {
    return minifyClassType(type);
  }

  removeBtnClicked(): void {
    this.removeBtn.emit(this.schedule.id);
    console.log(this.schedule.id);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 991.98; // phones & tablets
  }
}
