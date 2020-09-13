import {AfterViewInit, Component, HostListener, Input, OnInit} from '@angular/core';

import {LoggerService} from '../../_util/logger.service';
import {TranslateService} from '@ngx-translate/core';
import {TimetableService} from '../../_services/timetable.service';

import {Schedule} from '../../_domain/Schedule';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit, AfterViewInit {

  @Input() schedules: Schedule[];

  mobileView = false;

  constructor(
    private logger: LoggerService,
    public translateService: TranslateService,
    public timetableService: TimetableService
  ) { }

  ngOnInit(): void {
    this.onWindowResize();
  }

  ngAfterViewInit(): void {
    this.timetableService.createTimetable();
  }

  getTimelineHours(start, end): string[] {
    const timeline: string[] = [];
    let current = start;

    while (current !== end + 1) {
      let s = '';
      if (current.toString().length === 1) { s += '0'; }
      s += current + ':00';
      timeline.push(s);

      if (current !== end) {
        s = '';
        if (current.toString().length === 1) { s += '0'; }
        s += current + ':30';
        timeline.push(s);
      }
      current++;
    }
    return timeline;
  }

  pin(): void {
    console.log('pin');
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 800; // phones & tablets
    this.updateTimetable();
  }

  updateTimetable(): void {
    if (this.timetableService.timetableSchedulesObjs.length > 0) {
      this.timetableService.timetableSchedulesObjs.forEach((timetable) => {
        timetable.initSchedule();
      });
    }
  }
}
