import {Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {LoggerService} from '../../_util/logger.service';
import {ErrorService} from '../../_util/error.service';
import {AlertService} from '../../_util/alert.service';
import {TranslateService} from '@ngx-translate/core';
import {SchedulesGenerationService} from '../../_services/schedules-generation/schedules-generation.service';

import { faCaretRight, faCaretLeft, faThumbtack } from '@fortawesome/free-solid-svg-icons';

import {Schedule} from '../../_domain/Schedule/Schedule';
import {Event} from '../../_domain/Event/Event';
import {getTimestamp} from '../../_util/Time';
import {numberWithCommas} from '../../_util/Number';


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
    public translateService: TranslateService,
    private schedulesGenerationService: SchedulesGenerationService
  ) {
    setTimeout(() => {
      if (!this.pinActivated) {
        this.translateService.currentLang === 'pt-PT' ?
          this.alertService.showAlert(
            '💬 Dica',
            'Podes fixar uma aula clicando nela. Assim, apenas serão mostrados horários que a incluam.',
            'info') :
          this.alertService.showAlert(
            '💬 Tip',
            'You can pin a class slot by clicking on it. This way, only schedules that include that class will be shown.',
            'info');
      }
    }, 120000);

    if (!this.mobileView && Math.random() < 0.3) {
      setTimeout(() => {
        this.translateService.currentLang === 'pt-PT' ?
          this.alertService.showAlert(
            '💬 Dica',
            'Podes usar as setas do teclado para saltar mais rapidamente entre horários.',
            'info') :
          this.alertService.showAlert(
            '💬 Tip',
            'You can use the keyboard arrows to jump more quickly between schedules.',
            'info');
      }, 50000);
    }
  }

  ngOnInit(): void {
    this.scheduleInViewIndex = 0;
    this.scheduleInViewID = this.schedules[0].id;
    this.schedulesToShow = [...this.schedules];

    if (this.schedulesToShow.length > 0)
      this.organizeEventsPerWeekday(this.scheduleInViewID);

    this.onWindowResize();

    this.keydownEventsSubscription = this.keydownEvents.subscribe(direction => {
      if (direction === 'right') this.next();
      if (direction === 'left') this.prev();
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
        if (this.schedules.hasOwnProperty(key))
          temp.push(this.schedules[key]);
      }
      this.schedules = temp;

      this.schedulesToShow = this.filterSchedulesBasedOnPinnedShifts();
      this.scheduleInViewIndex = 0;
      this.scheduleInViewID = this.schedulesToShow[0].id;

      // Update timetable
      if (this.schedulesToShow.length > 0)
        this.organizeEventsPerWeekday(this.scheduleInViewID);
    }
  }

  getTimelineHours(start, end): string[] {
    const timeline: string[] = [];
    let current = start;

    while (current !== end + 1) {
      let s = '';
      if (current.toString().length === 1) s += '0';
      s += current + ':00';
      timeline.push(s);

      if (current !== end) {
        s = '';
        if (current.toString().length === 1) s += '0';
        s += current + ':30';
        timeline.push(s);
      }
      current++;
    }
    return timeline;
  }

  organizeEventsPerWeekday(scheduleID: number): void { // TODO: testing
    this.eventsPerWeekday.clear();
    const events = this.schedulesGenerationService.generatedSchedulesInfo.get(scheduleID).events;
    events.forEach(ev => {
      this.eventsPerWeekday.has(ev.weekday) ?
        this.eventsPerWeekday.get(ev.weekday).push(ev) : this.eventsPerWeekday.set(ev.weekday, [ev]);
    });
    this.logger.log('events per weekday', this.eventsPerWeekday);
  }

  prev(): void {
    if (this.scheduleInViewIndex > 0) {
      this.scheduleInViewID = this.schedulesToShow[--this.scheduleInViewIndex].id;

    } else {
      this.scheduleInViewIndex = this.schedulesToShow.length - 1;
      this.scheduleInViewID = this.schedulesToShow[this.scheduleInViewIndex].id;
    }
    this.organizeEventsPerWeekday(this.scheduleInViewID);
    this.schedulePicked();
  }

  next(): void {
    if (this.scheduleInViewIndex < this.schedulesToShow.length - 1) {
      this.scheduleInViewID = this.schedulesToShow[++this.scheduleInViewIndex].id;

    } else {
      this.scheduleInViewIndex = 0;
      this.scheduleInViewID = this.schedulesToShow[this.scheduleInViewIndex].id;
    }
    this.organizeEventsPerWeekday(this.scheduleInViewID);
    this.schedulePicked();
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
    return this.mobileView ? height > this.SLOT_HEIGHT_MOBILE * 2 : height > this.SLOT_HEIGHT_DESKTOP * 2;
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
      this.updateScheduleInViewIndex(this.schedulesToShow);
      this.organizeEventsPerWeekday(this.scheduleInViewID);

    } else { this.errorService.showError('Something went wrong while pinning shifts.'); }

    this.logger.log('Pinned shift ' + shiftName);
  }

  filterSchedulesBasedOnPinnedShifts(): Schedule[] { // TODO: testing
    const schedules: Schedule[] = [];

    for (const schedule of this.schedules) {
      let hasAllPinnedShifts = true;

      for (const pinnedShift of this.pinnedShifts) {
        let found = false;
        for (const cl of schedule.classes) {
          for (const shift of cl.shifts) {
            if (shift.name === pinnedShift) { found = true; break; }
          }
          if (found) break;
        }
        if (!found) { hasAllPinnedShifts = false; break; }
      }

      if (hasAllPinnedShifts) {
        schedules.push(schedule);
        this.schedulesGenerationService.generatedSchedulesInfo.get(schedule.id).events.forEach(ev => {
          ev.pinned = this.pinnedShifts.includes(ev.shiftName);
        });
      }
    }
    return schedules;
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

  numberWithCommas(x: number): string {
    return numberWithCommas(x);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 991.98; // phones & tablets
  }
}
