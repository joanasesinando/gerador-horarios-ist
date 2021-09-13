import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';

import {LoggerService} from '../_util/logger.service';
import {AlertService} from '../_util/alert.service';
import {SchedulesGenerationService} from '../_services/schedules-generation/schedules-generation.service';
import {StateService} from '../_services/state/state.service';
import {PdfGenerationService} from '../_services/pdf-generation/pdf-generation.service';

import {Course} from '../_domain/Course/Course';
import {Schedule} from '../_domain/Schedule/Schedule';
import {TranslateService} from '@ngx-translate/core';

import {numberWithCommas} from '../_util/Number';

import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import {Lesson} from '../_domain/Lesson/Lesson';
import { getMinifiedWeekday } from '../_util/Time';

declare let $;

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit, AfterViewInit {

  barValue = 0;

  generatedSchedules: Schedule[] = [];
  selectedCourses: Course[] = [];

  scheduleInViewID: number;
  schedulesPicked: Schedule[] = [];

  excludedShifts: string[] = [];
  excludedShiftsSubject: Subject<string[]> = new Subject<string[]>();

  excludedTimeframes: Lesson[] = [];
  excludedTimeframesSubject: Subject<Lesson[]> = new Subject<Lesson[]>();

  spinners = {
    loadingPage: true,
    sorting: false
  };

  mobileView = false;
  keyDownSubject: Subject<string> = new Subject<string>();

  // FontAwesome icons
  faQuestionCircle = faQuestionCircle;

  constructor(
    private logger: LoggerService,
    private router: Router,
    private alertService: AlertService,
    public generationService: SchedulesGenerationService,
    private stateService: StateService,
    private pdfService: PdfGenerationService,
    public translateService: TranslateService
  ) { }

  async updateBar(value: number): Promise<void> {
    if (value < -100 || value > 100) return;
    this.barValue += value;
    await this.setBar(this.barValue);
  }

  async setBar(value: number): Promise<void> {
    if (value < 0 || value > 100) return;
    this.barValue = value;
    const bar: HTMLElement = document.getElementById('bar');

    bar.style.width = value + '%';
    bar.innerText = Math.ceil(value) + '%';
    bar.setAttribute('aria-valuenow', value.toString());
    await new Promise(resolve => setTimeout(resolve, 200)); // sleep (give time to render html)
  }


  ngOnInit(): void {
    this.onWindowResize();

    // Receive selected courses
    if (!this.stateService.hasStateSaved()) {
      this.router.navigate(['/']);
      return;
    }
    this.selectedCourses = this.stateService.selectedCourses;
    this.logger.log('courses to generate', this.selectedCourses);
  }

  ngAfterViewInit(): void {
    this.generationService.setBarFunctions(this.updateBar, this.setBar);
    setTimeout(async () => {
      // Generate schedules
      const t0 = performance.now();
      this.generatedSchedules = await this.generationService.generateSchedules(this.selectedCourses);
      if (this.generatedSchedules[0]) this.scheduleInViewID = this.generatedSchedules[0].id;
      const t1 = performance.now();
      const generationTime = t1 - t0;
      this.logger.log('generated in (milliseconds)', generationTime);
      this.logger.log('generated schedules', this.generatedSchedules);

      if (this.generatedSchedules.length === 0) {
        this.translateService.currentLang === 'pt-PT' ?
          this.alertService.showAlert(
            'Sem horários',
            'Não existe nenhum horário possível com estas cadeiras. Remove alguma e tenta de novo.',
            'warning') :
          this.alertService.showAlert(
            'No schedules',
            'There\'s no available schedules for the selected courses. Remove one and try again.',
            'warning');

        this.goBack();
        return;
      }

      this.spinners.loadingPage = false;
      setTimeout(() => this.loadTooltips(), 100);
    }, 0);
  }

  loadTooltips(): void {
    this.translateService.stream('order-by.most-compact').subscribe(value => {
      const tooltip = $('#compact-tooltip');
      tooltip.attr('title', value);
      tooltip.tooltip('dispose');
      tooltip.tooltip();
    });

    this.translateService.stream('order-by.most-balanced').subscribe(value => {
      const tooltip = $('#balanced-tooltip');
      tooltip.attr('title', value);
      tooltip.tooltip('dispose');
      tooltip.tooltip();
    });

    this.translateService.stream('order-by.most-free-days').subscribe(value => {
      const tooltip = $('#free-days-tooltip');
      tooltip.attr('title', value);
      tooltip.tooltip('dispose');
      tooltip.tooltip();
    });
  }

  pickViewOption(option: string): void {
    this.spinners.sorting = true;
    switch (option) {
      case 'balanced':
        this.generatedSchedules = this.stateService.hasSchedulesSortedByMostBalanced() ?
          [...this.stateService.schedulesSortedByMostBalanced] :
          this.generationService.sortByMostBalanced(this.generatedSchedules);
        break;

      case 'free-days':
        this.generatedSchedules = this.stateService.hasSchedulesSortedByMostFreeDays() ?
          [...this.stateService.schedulesSortedByMostFreeDays] :
          this.generationService.sortByMostFreeDays(this.generatedSchedules);

        if (this.generationService.generatedSchedulesInfo.get(this.generatedSchedules[0].id).nr_free_days === 0) {
          this.translateService.currentLang === 'pt-PT' ?
            this.alertService.showAlert('Atenção', 'Não existe nenhum horário com dias livres', 'warning') :
            this.alertService.showAlert('Attention', 'There is no schedule with free days', 'warning');
        }
        break;

      case 'compact':
      default:
        this.generatedSchedules = this.stateService.hasSchedulesSortedByMostCompact() ?
          [...this.stateService.schedulesSortedByMostCompact] :
          this.generationService.sortByMostCompact(this.generatedSchedules);
        break;
    }
    this.spinners.sorting = false;
    this.logger.log('Changed view to ' + option);
  }

  removeExcludedShift(shiftName: string): void {
    this.excludedShiftsSubject.next(this.excludedShifts.filter(name => name !== shiftName));
  }

  removeExcludedTimeframe(timeframe: Lesson): void {
    this.excludedTimeframesSubject.next(this.excludedTimeframes.filter(tf => !tf.equal(timeframe)));
  }

  addSchedule(scheduleID: number): void {
    const scheduleIndex = this.findScheduleIndex(scheduleID, this.generatedSchedules);
    const scheduleToAdd = this.generatedSchedules[scheduleIndex];

    if (!this.schedulesPicked.includes(scheduleToAdd)) {
      this.schedulesPicked.push(scheduleToAdd);
    } else {
      this.translateService.currentLang === 'pt-PT' ?
        this.alertService.showAlert('Atenção', 'Este horário já foi adicionado!', 'warning') :
        this.alertService.showAlert('Attention', 'Schedule already added!', 'warning');
    }
    this.logger.log('schedules picked', this.schedulesPicked);
  }

  removeSchedule(scheduleID: number): void {
    const scheduleIndex = this.findScheduleIndex(scheduleID, this.generatedSchedules);
    const scheduleToRemove = this.generatedSchedules[scheduleIndex];

    if (this.schedulesPicked.includes(scheduleToRemove)) {
      this.schedulesPicked.splice(this.schedulesPicked.indexOf(scheduleToRemove), 1);
    }
    this.logger.log('schedules picked', this.schedulesPicked);
  }

  save(): void {
    this.pdfService.generateSchedulesPdf(this.schedulesPicked);
    this.logger.log('PDF generated');
  }

  findScheduleIndex(scheduleID: number, schedules: Schedule[]): number {
    for (let i = 0; i < schedules.length; i++) {
      if (schedules[i].id === scheduleID) return i;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  onKeyDownArrowRight(): void {
    this.keyDownSubject.next('right');
  }

  onKeyDownArrowLeft(): void {
    this.keyDownSubject.next('left');
  }

  capitalize(s: string): string {
    return s[0].toUpperCase() + s.substr(1);
  }

  numberWithCommas(x: number): string {
    return numberWithCommas(x);
  }

  getMinifiedWeekday(day: number): string {
    return getMinifiedWeekday(day, this.translateService.currentLang);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
  }

  @HostListener('window:popstate', [])
  onPopState(): void {
    this.goBack();
  }
}
