import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

import {LoggerService} from '../../_util/logger.service';
import {TranslateService} from '@ngx-translate/core';

import {Schedule} from '../../_domain/Schedule';
import {Event} from '../../_domain/Event';
import {minifyClassType} from '../../_domain/ClassType';
import {formatTime} from '../../_util/Time';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit {

  SLOT_HEIGHT_DESKTOP = 25;
  SLOT_HEIGHT_MOBILE = 25;

  TIMELINE_START = '08:00';
  TIMELINE_UNIT_DURATION = 30;

  @Input() schedules: Schedule[];
  @Output() scheduleSelected = new EventEmitter<number>();

  currentSchedule = 0;
  eventsPerSchedule: Map<number, Event[]> = new Map();
  eventsPerWeekday: Map<string, Event[]> = new Map();

  mobileView = false;

  constructor(private logger: LoggerService, public translateService: TranslateService) { }

  ngOnInit(): void {
    if (this.schedules.length > 0) {
      this.createEvents();
      this.organizeEventsPerWeekday(0);
    }
    this.onWindowResize();
  }

  getTimelineHours(start, end): string[] {
    const timeline: string[] = [];
    let current = start;

    if (window.innerWidth < 1000) {
      while (current !== end + 1) {
        timeline.push(current + 'H');
        if (current !== end) {
          timeline.push(current + ':30H');
        }
        current++;
      }

    } else {
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
            const start = formatTime(lesson.start);
            const end = formatTime(lesson.end);
            const name = acronym.replace(/[0-9]/g, '') + ' (' + type + ')';
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

  prev(): void {
    if (this.currentSchedule > 0) {
      this.eventsPerWeekday.clear();
      this.organizeEventsPerWeekday(--this.currentSchedule);
      this.schedulePicked();
    }
  }

  next(): void {
    if (this.currentSchedule < this.schedules.length - 1) {
      this.eventsPerWeekday.clear();
      this.organizeEventsPerWeekday(++this.currentSchedule);
      this.schedulePicked();
    }
  }

  getTop(start: string): string {
    const eventSlotHeight = this.mobileView ? this.SLOT_HEIGHT_MOBILE : this.SLOT_HEIGHT_DESKTOP;
    const begin = this.getTimestamp(start);
    return eventSlotHeight * (begin - this.getTimestamp(this.TIMELINE_START)) / this.TIMELINE_UNIT_DURATION + 'px';
  }

  getHeight(start: string, end: string): string {
    const eventSlotHeight = this.mobileView ? this.SLOT_HEIGHT_MOBILE : this.SLOT_HEIGHT_DESKTOP;
    const begin = this.getTimestamp(start);
    const duration = this.getTimestamp(end) - begin;
    return eventSlotHeight * duration / this.TIMELINE_UNIT_DURATION + 'px';
  }

  /* ----------------------------------------------------------
   * Converts time to timestamp. Accepts HH:mm format.
   * ---------------------------------------------------------- */
  getTimestamp(time: string): number {
    time = time.replace(/ /g, '');
    const timeArray = time.split(':');
    const hours = timeArray[0];
    const min = timeArray[1];
    return parseInt(hours, 10) * 60 + parseInt(min, 10);
  }

  pin(): void {
    console.log('pin');
  }

  schedulePicked(): void {
    this.scheduleSelected.emit(this.currentSchedule);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 800; // phones & tablets
  }
}
