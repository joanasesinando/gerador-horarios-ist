import {Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {LoggerService} from '../../_util/logger.service';
import {ErrorService} from '../../_util/error.service';
import {AlertService} from '../../_util/alert.service';
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
export class TimetableComponent implements OnInit, OnDestroy, OnChanges {

  SLOT_HEIGHT_DESKTOP = 27;
  SLOT_HEIGHT_MOBILE = 25;

  TIMELINE_START = '08:00';
  TIMELINE_UNIT_DURATION = 30;

  @Input() schedules: Schedule[];
  @Input() keydownEvents: Observable<string>;
  @Output() scheduleSelected = new EventEmitter<number>();

  scheduleInViewIndex: number;
  scheduleInViewID: number;
  eventsPerSchedule: Map<number, Event[]> = new Map(); // schedule.id --> events
  eventsPerWeekday: Map<string, Event[]> = new Map(); // weekday --> events

  schedulesToShow: Schedule[];
  pinnedShifts: string[] = [];

  mobileView = false;
  pinActivated = false;

  keydownEventsSubscription: Subscription;

  faCaretRight = faCaretRight;
  faCaretLeft = faCaretLeft;
  faThumbtack = faThumbtack;

  constructor(
    private logger: LoggerService,
    private errorService: ErrorService,
    private alertService: AlertService,
    public translateService: TranslateService
  ) {
    setTimeout(() => {
      if (!this.pinActivated) {
        this.alertService.showAlert(
          '💬 Dica',
          'Sabias que podes fixar uma aula clicando nela? Experimenta!',
          'info');
      }
    }, 120000);
  }

  ngOnInit(): void {
    this.scheduleInViewIndex = 0;
    this.scheduleInViewID = this.schedules[0].id;
    this.schedulesToShow = _.cloneDeep(this.schedules);

    if (this.schedulesToShow.length > 0) {
      this.createEvents(this.schedulesToShow);
      this.organizeEventsPerWeekday(this.scheduleInViewID);
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.schedules && changes.schedules.previousValue &&
      changes.schedules.previousValue !== changes.schedules.currentValue) {

      // Convert to array (comes as object)
      const temp: Schedule[] = [];
      for (const key in this.schedules) {
        if (this.schedules.hasOwnProperty(key)) {
          temp.push(this.schedules[key]);
        }
      }
      this.schedules = temp;

      this.schedulesToShow = this.filterSchedulesBasedOnPinnedShifts();
      this.scheduleInViewIndex = 0;
      this.scheduleInViewID = this.schedulesToShow[0].id;

      // Update timetable
      if (this.schedulesToShow.length > 0) {
        this.organizeEventsPerWeekday(this.scheduleInViewID);
      }
    }
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

  organizeEventsPerWeekday(scheduleID: number): void { // TODO: testing
    this.eventsPerWeekday.clear();
    const events = this.eventsPerSchedule.get(scheduleID);
    events.forEach(ev => {
      this.eventsPerWeekday.has(ev.weekday) ?
        this.eventsPerWeekday.get(ev.weekday).push(ev) : this.eventsPerWeekday.set(ev.weekday, [ev]);
    });
    this.logger.log('events per weekday', this.eventsPerWeekday);
  }

  prev(): void {
    if (this.scheduleInViewIndex > 0) {
      this.scheduleInViewID = this.schedulesToShow[--this.scheduleInViewIndex].id;
      this.organizeEventsPerWeekday(this.scheduleInViewID);
      this.schedulePicked();
    }
  }

  next(): void {
    if (this.scheduleInViewIndex < this.schedulesToShow.length - 1) {
      this.scheduleInViewID = this.schedulesToShow[++this.scheduleInViewIndex].id;
      this.organizeEventsPerWeekday(this.scheduleInViewID);
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
    this.pinActivated = true;
    const shiftName = event.getAttribute('data-shift');
    this.pinnedShifts.includes(shiftName) ?
      this.pinnedShifts.splice(this.pinnedShifts.indexOf(shiftName), 1) :
      this.pinnedShifts.push(shiftName);

    // Select which schedules to show
    this.schedulesToShow = this.filterSchedulesBasedOnPinnedShifts();

    // Update timetable
    if (this.schedulesToShow.length > 0) {
      this.createEvents(this.schedulesToShow);
      this.updateScheduleInViewIndex(this.schedulesToShow);
      this.organizeEventsPerWeekday(this.scheduleInViewID);

    } else { this.errorService.showError('Something went wrong while pinning shifts.'); }

    this.logger.log('Pinned shift ' + shiftName);
  }

  filterSchedulesBasedOnPinnedShifts(): Schedule[] { // TODO: testing
    let filteredSchedules = this.schedules;

    this.pinnedShifts.forEach(pinnedShift => {
      const temp: Schedule[] = [];

      filteredSchedules.forEach(schedule => {
        schedule.classes.forEach(cl => {
          cl.shifts.forEach(shift => {
            if (shift.name === pinnedShift) temp.push(schedule);
          });
        });
      });

      filteredSchedules = temp;
    });
    return filteredSchedules;
  }

  updateScheduleInViewIndex(schedules: Schedule[]): void {
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      if (schedule.id === this.scheduleInViewID) {
        this.scheduleInViewIndex = i;
        return;
      }
    }
  }

  schedulePicked(): void {
    this.scheduleSelected.emit(this.scheduleInViewID);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 991.98; // phones & tablets
  }
}
