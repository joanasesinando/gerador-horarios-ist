import {AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

import {LoggerService} from '../../_util/logger.service';
import {TranslateService} from '@ngx-translate/core';
import {TimetableService} from '../../_services/timetable.service';

import {Schedule} from '../../_domain/Schedule';
import {minifyClassType} from '../../_domain/ClassType';
import {Event} from '../../_domain/Event';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit, AfterViewInit {

  @Input() schedules: Schedule[];

  @Output() scheduleSelected = new EventEmitter<number>();

  currentSchedule = 0;
  eventsPerSchedule: Map<number, Event[]> = new Map();
  eventsPerWeekday: Map<string, Event[]> = new Map();

  mobileView = false;

  constructor(
    private logger: LoggerService,
    public translateService: TranslateService,
    public timetableService: TimetableService
  ) { }

  ngOnInit(): void {
    this.createEvents();
    this.organizeEventsPerWeekday(0);
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

  createEvents(): void { // TODO: testing
    for (let i = 0; i < this.schedules.length; i++) {
      const schedule = this.schedules[i];
      let tag = 1;

      schedule.classes.forEach(cl => {
        const acronym = cl.course.acronym;

        cl.shifts.forEach(shift => {
          const type = minifyClassType(shift.types[0]); // NOTE: potential bug

          shift.lessons.forEach(lesson => {
            const weekday = this.getWeekday(lesson.start.getDay());
            const start = this.formatTime(lesson.start);
            const end = this.formatTime(lesson.end);
            const name = acronym + ' (' + type + ')';
            const place = lesson.room;
            this.eventsPerSchedule.has(i) ?
              this.eventsPerSchedule.get(i).push(new Event(tag, weekday, start, end, name, place)) :
              this.eventsPerSchedule.set(i, [new Event(tag, weekday, start, end, name, place)]);
          });
        });

        tag++;
      });
    }
    this.logger.log('events per schedule', this.eventsPerSchedule);
  }

  organizeEventsPerWeekday(scheduleIndex: number): void { // TODO: testing
    const events = this.eventsPerSchedule.get(scheduleIndex);
    events.forEach(ev => {
      this.eventsPerWeekday.has(ev.weekday) ?
        this.eventsPerWeekday.get(ev.weekday).push(ev) : this.eventsPerWeekday.set(ev.weekday, [ev]);
    });
    this.logger.log('events per weekday', this.eventsPerWeekday);
  }

  getWeekday(day: number): string {
    switch (day) {
      case 1:
        return 'monday';
      case 2:
        return 'tuesday';
      case 3:
        return 'wednesday';
      case 4:
        return 'thursday';
      case 5:
        return 'friday';
      case 6:
        return 'saturday';
      case 7:
        return 'sunday';
    }
  }

  formatTime(date: Date): string {
    let hours: any = date.getHours();
    let min: any = date.getMinutes();

    if (hours < 10) { hours = '0' + hours; }
    if (min < 10) { min = '0' + min; }
    return hours + ':' + min;
  }

  prev(): void {
    if (this.currentSchedule > 0) {
      this.eventsPerWeekday.clear();
      this.organizeEventsPerWeekday(--this.currentSchedule);
      this.timetableService.updateTimetable();
      this.schedulePicked();
    }
  }

  next(): void {
    if (this.currentSchedule < this.schedules.length - 1) {
      this.eventsPerWeekday.clear();
      this.organizeEventsPerWeekday(++this.currentSchedule);
      this.timetableService.updateTimetable();
      this.schedulePicked();
    }
  }

  pin(): void {
    console.log('pin');
  }

  schedulePicked(): void {
    this.scheduleSelected.emit(this.currentSchedule + 1);
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
