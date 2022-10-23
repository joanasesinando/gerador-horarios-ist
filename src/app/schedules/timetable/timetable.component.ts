import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {NgForm} from '@angular/forms';

import {LoggerService} from '../../_util/logger.service';
import {ErrorService} from '../../_util/error.service';
import {AlertService} from '../../_util/alert.service';
import {TranslateService} from '@ngx-translate/core';
import {SchedulesGenerationService} from '../../_services/schedules-generation/schedules-generation.service';

import {
  faCaretRight,
  faCaretLeft,
  faThumbtack,
  faEllipsisV,
  faTimes,
  faCog,
  faTint
} from '@fortawesome/free-solid-svg-icons';

import {Schedule} from '../../_domain/Schedule/Schedule';
import {Event} from '../../_domain/Event/Event';
import {Lesson} from '../../_domain/Lesson/Lesson';

import {getDateFromTimeAndDay, getTimestamp, getWeekday} from '../../_util/Time';
import {numberWithCommas} from '../../_util/Number';

import Pickr from '@simonwep/pickr';

declare let $;


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
  @Input() onExcludedShiftsChanged: Observable<string[]>;
  @Input() onExcludedTimeframesChanged: Observable<Lesson[]>;

  @Output() scheduleSelected = new EventEmitter<number>();
  @Output() excludedShiftsChanged = new EventEmitter<string[]>();
  @Output() excludedTimeframesChanged = new EventEmitter<Lesson[]>();

  scheduleInViewIndex: number;
  scheduleInViewID: number;
  eventsPerWeekday: Map<string, Event[]> = new Map(); // weekday --> events

  schedulesToShow: Schedule[];
  pinnedShifts: string[] = [];
  excludedShifts: string[] = [];
  excludedTimeframes: Lesson[] = []; // use special null Lesson for simplicity

  eventColors: {[tag: number]: string} = {
    1: '#577F92',
    2: '#443453',
    3: '#A2B9B2',
    4: '#f6b067',
    5: '#a26885',
    6: '#42516D',
    7: '#967da0',
    8: '#61816e'
  };
  eventOriginalColor: string;
  colorPicker: Pickr;
  @Output() eventColorsChanged: EventEmitter<{[tag: number]: string}> = new EventEmitter<{[tag: number]: string}>();

  @ViewChild('f', { static: false }) f: NgForm;

  // For excluding timeframes
  weekdays: string[];
  selectedWeekday: number;
  selectedStartTime: string;
  selectedEndTime: string;
  saving = false;

  mobileView = false;
  pinActivated = false;

  keydownEventsSubscription: Subscription;

  faCaretRight = faCaretRight;
  faCaretLeft = faCaretLeft;
  faThumbtack = faThumbtack;
  faTimes = faTimes;
  faEllipsisV = faEllipsisV;
  faCog = faCog;
  faTint = faTint;

  constructor(
    private logger: LoggerService,
    private errorService: ErrorService,
    private alertService: AlertService,
    public translateService: TranslateService,
    private schedulesGenerationService: SchedulesGenerationService
  ) {

    // Get weekdays strings
    switch (this.translateService.currentLang) {
      case 'pt-PT':
        this.weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        break;

      case 'en-GB':
      default:
        this.weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        break;
    }

    setTimeout(() => {
      if (!this.pinActivated) { // FIXME: use cookies & random dicas
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

    $('#excludeTimeframeModal').on('hide.bs.modal', (event) => {
      this.selectedWeekday = undefined;
      this.selectedStartTime = undefined;
      this.selectedEndTime = undefined;
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

      this.schedulesToShow = this.filterSchedules();
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
    if (scheduleID !== -1) {
      const events = this.schedulesGenerationService.generatedSchedulesInfo.get(scheduleID).events;
      events.forEach(ev => {
        this.eventsPerWeekday.has(ev.weekday) ?
          this.eventsPerWeekday.get(ev.weekday).push(ev) : this.eventsPerWeekday.set(ev.weekday, [ev]);
      });
    }
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

  getColor(tag: string): string {
    return this.eventColors[tag];
  }

  isTallEnough(start, end): boolean {
    const height = parseInt(this.getHeight(start, end).replace('px', ''), 10);
    return this.mobileView ? height > this.SLOT_HEIGHT_MOBILE * 2 : height > this.SLOT_HEIGHT_DESKTOP * 2;
  }

  closeOptions(target?: ElementRef): void {
    if (!target) { // close all
      $('.options.open').removeClass('open');

    } else { // close selected
      const optionsMenu = $(target.nativeElement.closest('.single-event').children[1]);
      optionsMenu.removeClass('open');
    }
  }

  toggleOptions(ev: Event, pinned: boolean): void {
    const eventSlot = $('.single-event[data-shift=\'' + ev.shiftName + '\'][data-day=\'' + ev.weekday + '\'][data-start=\'' + ev.start + '\'][data-end=\'' + ev.end + '\']');
    const optionsMenu = eventSlot.children('.options');
    if (!optionsMenu.hasClass('open')) this.closeOptions();
    optionsMenu.toggleClass('open');

    // Show tooltip
    const pinOption = optionsMenu.children().eq(0);
    pinOption.attr('title', this.translateService.instant('schedules.eventOptions.' + (pinned ? 'unpin' : 'pin')));
    pinOption.tooltip('dispose');
    pinOption.tooltip();

    const excludeOption = optionsMenu.children().eq(1);
    excludeOption.attr('title', this.translateService.instant('schedules.eventOptions.exclude'));
    excludeOption.tooltip('dispose');
    excludeOption.tooltip();

    const paintOption = optionsMenu.children().eq(2);
    paintOption.attr('title', this.translateService.instant('schedules.eventOptions.paint'));
    paintOption.tooltip('dispose');
    paintOption.tooltip();
  }

  togglePin(shiftName: string): void { // TODO: testing
    this.pinActivated = true;
    this.pinnedShifts.includes(shiftName) ?
      this.pinnedShifts.splice(this.pinnedShifts.indexOf(shiftName), 1) :
      this.pinnedShifts.push(shiftName);

    // Select which schedules to show
    this.schedulesToShow = this.filterSchedules();

    // Update timetable
    if (this.schedulesToShow.length > 0) {
      this.updateScheduleInViewIndex(this.schedulesToShow);
      this.organizeEventsPerWeekday(this.scheduleInViewID);

    } else { this.errorService.showError('Something went wrong while pinning shifts.'); }

    this.logger.log((this.pinnedShifts.includes(shiftName) ? 'Pinned' : 'Unpinned') + ' shift ' + shiftName);
  }

  toggleExcludeShift(shiftName): void {
    this.onExcludedShiftsChanged.subscribe(excludedShifts => {
      this.excludedShifts = excludedShifts;
      this.toggleExcludeShift(null);
    });

    if (shiftName) {
      this.excludedShifts.includes(shiftName) ?
        this.excludedShifts.splice(this.excludedShifts.indexOf(shiftName), 1) :
        this.excludedShifts.push(shiftName);
    }

    // Select which schedules to show
    this.schedulesToShow = this.filterSchedules();

    // Update timetable
    this.scheduleInViewIndex = this.schedulesToShow.length > 0 ? 0 : -1;
    this.scheduleInViewID = this.schedulesToShow.length > 0 ? this.schedulesToShow[0].id : -1;
    this.organizeEventsPerWeekday(this.scheduleInViewID);
    if (this.schedulesToShow.length === 0) {
      this.translateService.currentLang === 'pt-PT' ?
        this.alertService.showAlert('Sem horários', 'Não existe nenhum horário com as opções escolhidas.', 'warning') :
        this.alertService.showAlert('No schedules', 'No schedules with your options.', 'warning');
    }

    this.excludedShiftsChanged.emit(this.excludedShifts);
    $('[data-toggle="tooltip"]').tooltip('hide');

    this.logger.log((shiftName ? 'Excluded' : 'Included') + ' shift ' + (shiftName || ''));
  }

  toggleColorPicker(ev: Event): void {
    // Init color picker
    this.translateService.stream('schedules.save').subscribe(saveBtnText => {
      this.translateService.stream('cancel').subscribe(cancelBtnText => {
        setTimeout(() => {
          this.colorPicker = Pickr.create({
            el: '.single-event[data-start="' + ev.start + '"][data-end="' + ev.end + '"][data-day="' + ev.weekday + '"]',
            theme: 'nano',
            useAsButton: true,
            position: 'top-middle',
            lockOpacity: true,
            comparison: true,
            components: {
              preview: true,
              hue: true,
              interaction: {
                input: true,
                cancel: true,
                save: true
              }
            },
            i18n: {
              'btn:save': saveBtnText,
              'btn:cancel': cancelBtnText
            },
            swatches: [
              '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C',
              '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F',
              '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C',
              '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92',
              '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E',
              '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1',
              '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B',
              '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064',
              '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40',
              '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20',
              '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E',
              '#DCE775', '#D4E157', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717',
              '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17',
              '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00',
              '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100',
              '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C'
            ],

          }).on('init', pickr => {
            this.eventOriginalColor = this.eventColors[ev.tag];

          }).on('hide', pickr => {
            this.colorPicker.destroy();

          }).on('change', (color, source, instance) => {
            this.eventColors[ev.tag] = color.toHEXA().toString(0);

          }).on('save', (color, pickr) => {
            this.eventColors[ev.tag] = color.toHEXA().toString(0);
            this.colorPicker.hide();
            this.eventColorsChanged.emit(this.eventColors);

          }).on('cancel', pickr => {
            this.eventColors[ev.tag] = this.eventOriginalColor;
            this.colorPicker.hide();
          });
          this.colorPicker.show();
        }, 0);
      });
    });
  }

  filterSchedules(): Schedule[] { // TODO: testing
    const schedules: Schedule[] = [];

    for (const schedule of this.schedules) {

      const shiftNames: string[] = [];
      for (const cl of schedule.classes) {
        for (const shift of cl.shifts) {
          shiftNames.push(shift.name);
        }
      }

      let hasAllPinnedShifts = true;
      for (const pinnedShift of this.pinnedShifts) {
        if (!shiftNames.includes(pinnedShift)) {
          hasAllPinnedShifts = false;
          break;
        }
      }

      if (hasAllPinnedShifts) {
        let hasAnExcludedShift = false;

        for (const excludedShift of this.excludedShifts) {
          if (shiftNames.includes(excludedShift)) {
            hasAnExcludedShift = true;
            break;
          }
        }

        if (!hasAnExcludedShift) {
          let overlapsWithExcludedTimeframe = false;

          for (const cl of schedule.classes) {
            for (const shift of cl.shifts) {
              for (const lesson of shift.lessons) {
                for (const excluded of this.excludedTimeframes) {
                  if (lesson.overlap(excluded)) {
                    overlapsWithExcludedTimeframe = true;
                    break;
                  }
                }
                if (overlapsWithExcludedTimeframe) break;
              }
              if (overlapsWithExcludedTimeframe) break;
            }
            if (overlapsWithExcludedTimeframe) break;
          }

          if (!overlapsWithExcludedTimeframe) {
            schedules.push(schedule);
            this.schedulesGenerationService.generatedSchedulesInfo.get(schedule.id).events.forEach(ev => {
              ev.pinned = this.pinnedShifts.includes(ev.shiftName);
            });
          }
        }
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

  manageExcludedTimeframes(timeframe: Lesson): void {
    if (timeframe) {
      const index = this.excludedTimeframes.findIndex(el => el.equal(timeframe));
      index !== -1 ? this.excludedTimeframes.splice(index, 1) : this.excludedTimeframes.push(timeframe);
    }

    // Select which schedules to show
    this.schedulesToShow = this.filterSchedules();

    // Update timetable
    this.scheduleInViewIndex = this.schedulesToShow.length > 0 ? 0 : -1;
    this.scheduleInViewID = this.schedulesToShow.length > 0 ? this.schedulesToShow[0].id : -1;
    this.organizeEventsPerWeekday(this.scheduleInViewID);
    if (this.schedulesToShow.length === 0) {
      this.translateService.currentLang === 'pt-PT' ?
        this.alertService.showAlert('Sem horários', 'Não existe nenhum horário com as opções escolhidas.', 'warning') :
        this.alertService.showAlert('No schedules', 'No schedules with your options.', 'warning');
    }

    this.excludedTimeframesChanged.emit(this.excludedTimeframes);

    // tslint:disable-next-line:max-line-length
    this.logger.log('Excluded timeframe: ' + getWeekday(this.selectedWeekday) + ' ' + this.selectedStartTime + '->' + this.selectedEndTime);
  }

  onSubmit(): void {
    if (this.f.form.valid) {
      this.saving = true;
      const nullLesson = new Lesson(
        getDateFromTimeAndDay(this.selectedStartTime, parseInt(this.selectedWeekday as any, 10)),
        getDateFromTimeAndDay(this.selectedEndTime, parseInt(this.selectedWeekday as any, 10)),
        null, null);

      this.manageExcludedTimeframes(nullLesson);

      this.saving = false;
      $('#excludeTimeframeModal').modal('hide');

      this.selectedWeekday = null;
      this.selectedStartTime = null;
      this.selectedEndTime = null;

      this.onExcludedTimeframesChanged.subscribe(excludedTimeframes => {
        this.excludedTimeframes = excludedTimeframes;
        this.manageExcludedTimeframes(null);
      });

    } else {
      this.alertService.showAlert('Form invalid', 'Please fill in all fields', 'danger');
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth < 991.98; // phones & tablets
  }
}
