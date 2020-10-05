import {Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {LoggerService} from '../../_util/logger.service';
import {ErrorService} from '../../_util/error.service';
import {TranslateService} from '@ngx-translate/core';
import _ from 'lodash';

import { faCaretRight, faCaretLeft, faThumbtack } from '@fortawesome/free-solid-svg-icons';

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

  currentScheduleIndex = 0;
  currentScheduleID = 0;
  eventsPerSchedule: Map<number, Event[]> = new Map(); // schedule.id --> events
  eventsPerWeekday: Map<string, Event[]> = new Map(); // weekday --> events

  schedulesToShow: Schedule[];
  pinnedShifts: string[] = [];

  mobileView = false;

  keydownEventsSubscription: Subscription;

  faCaretRight = faCaretRight;
  faCaretLeft = faCaretLeft;
  faThumbtack = faThumbtack;

  constructor(
    private logger: LoggerService,
    private errorService: ErrorService,
    public translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.schedulesToShow = _.cloneDeep(this.schedules);
    if (this.schedulesToShow.length > 0) {
      this.createEvents(this.schedulesToShow);
      this.organizeEventsPerWeekday(0);
    }
    this.onWindowResize();
    this.keydownEventsSubscription = this.keydownEvents.subscribe(direction => {
      if (direction === 'right') { this.next(); }
      if (direction === 'left') { this.prev(); }
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

  createEvents(schedules: Schedule[]): void { // TODO: testing
    this.eventsPerSchedule.clear();
    for (const schedule of schedules) {
      let tag = 1;

      schedule.classes.forEach(cl => {
        const acronym = cl.course.acronym;

        cl.shifts.forEach(shift => {
          const type = minifyClassType(shift.type);
          const pinned = this.pinnedShifts.includes(shift.name);

          shift.lessons.forEach(lesson => {
            const weekday = getWeekday(lesson.start.getDay());
            const start = formatTime(lesson.start);
            const end = formatTime(lesson.end);
            const name = acronym.replace(/[0-9]/g, '') + ' (' + type + ')';
            const place = lesson.room;
            this.eventsPerSchedule.has(schedule.id) ?
              this.eventsPerSchedule.get(schedule.id).push(new Event(shift.name, tag, weekday, start, end, name, place, pinned)) :
              this.eventsPerSchedule.set(schedule.id, [new Event(shift.name, tag, weekday, start, end, name, place, pinned)]);
          });
        });

        tag++;
      });
    }
    this.logger.log('events per schedule', this.eventsPerSchedule);
  }

  organizeEventsPerWeekday(scheduleIndex: number): void { // TODO: testing
    this.eventsPerWeekday.clear();
    const events = this.eventsPerSchedule.get(scheduleIndex);
    events.forEach(ev => {
      this.eventsPerWeekday.has(ev.weekday) ?
        this.eventsPerWeekday.get(ev.weekday).push(ev) : this.eventsPerWeekday.set(ev.weekday, [ev]);
    });
    this.logger.log('events per weekday', this.eventsPerWeekday);
  }

  prev(): void {
    if (this.currentScheduleIndex > 0) {
      this.currentScheduleID = this.schedulesToShow[--this.currentScheduleIndex].id;
      this.organizeEventsPerWeekday(this.currentScheduleID);
      this.schedulePicked();
    }
  }

  next(): void {
    if (this.currentScheduleIndex < this.schedulesToShow.length - 1) {
      this.currentScheduleID = this.schedulesToShow[++this.currentScheduleIndex].id;
      this.organizeEventsPerWeekday(this.currentScheduleID);
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

  togglePin(event): void { // TODO: testing
    const shiftName = event.getAttribute('data-shift');
    this.pinnedShifts.includes(shiftName) ?
      this.pinnedShifts.splice(this.pinnedShifts.indexOf(shiftName), 1) :
      this.pinnedShifts.push(shiftName);

    // Select which schedules to show
    this.schedulesToShow = this.filterSchedulesBasedOnPinnedShifts();

    // Update timetable
    if (this.schedulesToShow.length > 0) {
      this.createEvents(this.schedulesToShow);
      this.updateCurrentScheduleIndex(this.schedulesToShow);
      this.organizeEventsPerWeekday(this.currentScheduleID);

    } else { this.errorService.showError('Something went wrong while pinning shifts.'); }

    this.logger.log('Pinned shift ' + shiftName);
  }

  filterSchedulesBasedOnPinnedShifts(): Schedule[] { // TODO: testing
    let filteredSchedules = _.cloneDeep(this.schedules);

    this.pinnedShifts.forEach(pinnedShift => {
      const temp: Schedule[] = [];

      filteredSchedules.forEach(schedule => {
        schedule.classes.forEach(cl => {
          cl.shifts.forEach(shift => {
            if (shift.name === pinnedShift) { temp.push(schedule); }
          });
        });
      });

      filteredSchedules = _.cloneDeep(temp);
    });
    return filteredSchedules;
  }

  updateCurrentScheduleIndex(schedules: Schedule[]): void {
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      if (schedule.id === this.currentScheduleID) {
        this.currentScheduleIndex = i;
        return;
      }
    }
  }

  schedulePicked(): void {
    this.scheduleSelected.emit(this.currentScheduleID);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 991.98; // phones & tablets
  }
}
