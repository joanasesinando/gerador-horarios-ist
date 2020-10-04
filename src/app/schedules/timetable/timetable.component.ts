import {Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {LoggerService} from '../../_util/logger.service';
import {TranslateService} from '@ngx-translate/core';

import { faCaretRight, faCaretLeft } from '@fortawesome/free-solid-svg-icons';

import {Schedule} from '../../_domain/Schedule';
import {Event} from '../../_domain/Event';
import {minifyClassType} from '../../_domain/ClassType';
import {formatTime, getTimestamp, getWeekday} from '../../_util/Time';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit, OnDestroy {

  SLOT_HEIGHT_DESKTOP = 27;
  SLOT_HEIGHT_MOBILE = 25;

  TIMELINE_START = '08:00';
  TIMELINE_UNIT_DURATION = 30;

  @Input() schedules: Schedule[];
  @Input() keydownEvents: Observable<string>;
  @Output() scheduleSelected = new EventEmitter<number>();

  currentSchedule = 0;
  eventsPerSchedule: Map<number, Event[]> = new Map();
  eventsPerWeekday: Map<string, Event[]> = new Map();

  mobileView = false;

  keydownEventsSubscription: Subscription;

  faCaretRight = faCaretRight;
  faCaretLeft = faCaretLeft;

  constructor(private logger: LoggerService, public translateService: TranslateService) { }

  ngOnInit(): void {
    if (this.schedules.length > 0) {
      this.createEvents();
      this.organizeEventsPerWeekday(0);
    }
    this.onWindowResize();
    this.keydownEventsSubscription = this.keydownEvents.subscribe(direction => {
      switch (direction) {
        case 'right':
          this.next();
          break;

        case 'left':
          this.prev();
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.keydownEventsSubscription.unsubscribe();
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
          const type = minifyClassType(shift.type);

          shift.lessons.forEach(lesson => {
            const weekday = getWeekday(lesson.start.getDay());
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
    const begin = getTimestamp(start);
    return eventSlotHeight * (begin - getTimestamp(this.TIMELINE_START)) / this.TIMELINE_UNIT_DURATION + 'px';
  }

  getHeight(start: string, end: string): string {
    const eventSlotHeight = this.mobileView ? this.SLOT_HEIGHT_MOBILE : this.SLOT_HEIGHT_DESKTOP;
    const begin = getTimestamp(start);
    const duration = getTimestamp(end) - begin;
    return eventSlotHeight * duration / this.TIMELINE_UNIT_DURATION + 'px';
  }

  isTallEnough(start, end): boolean {
    const height = parseInt(this.getHeight(start, end).replace('px', ''), 10);
    return height > this.SLOT_HEIGHT_DESKTOP * 2;
  }

  pin(): void {
    console.log('pin');
  }

  schedulePicked(): void {
    this.scheduleSelected.emit(this.currentSchedule);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 991.98; // phones & tablets
  }
}
