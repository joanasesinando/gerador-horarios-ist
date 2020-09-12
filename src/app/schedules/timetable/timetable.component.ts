import {AfterViewInit, Component, HostListener, Input, OnInit} from '@angular/core';

import {TranslateService} from '@ngx-translate/core';

import {Timetable} from '../../_domain/Timetable';
import {Schedule} from '../../_domain/Schedule';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit, AfterViewInit {

  @Input() shedules: Schedule[];
  mobileView = false;
  timeline = { start: 8, end: 20, hours: [] };

  constructor(public translateService: TranslateService) {
    this.getTimelineHours(this.timeline.start, this.timeline.end);
  }

  ngOnInit(): void {
    this.onWindowResize();
  }

  ngAfterViewInit(): void {
    Timetable.create();
  }

  getTimelineHours(start, end): void {
    let current = start;

    while (current !== end + 1) {
      let s = '';
      if (current.toString().length === 1) { s += '0'; }
      s += current + ':00';
      this.timeline.hours.push(s);

      if (current !== end) {
        s = '';
        if (current.toString().length === 1) { s += '0'; }
        s += current + ':30';
        this.timeline.hours.push(s);
      }
      current++;
    }
    console.log('finished timeline');
  }

  pin(): void {
    console.log('pin');
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 800; // phones & tablets
  }

}
