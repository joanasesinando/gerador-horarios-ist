import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';

import {LoggerService} from '../_util/logger.service';
import {AlertService} from '../_util/alert.service';
import {SchedulesGenerationService} from '../_services/schedules-generation/schedules-generation.service';
import {StateService} from '../_services/state/state.service';
import {PdfGenerationService} from '../_services/pdf-generation/pdf-generation.service';

import {Course} from '../_domain/Course';
import {Schedule} from '../_domain/Schedule';


@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit, AfterViewInit {

  generatedSchedules: Schedule[] = [];
  selectedCourses: Course[] = [];

  scheduleInViewID: number;
  schedulesPicked: Schedule[] = [];

  spinners = {
    loadingPage: true,
    sorting: false
  };

  mobileView = false;
  keyDownSubject: Subject<string> = new Subject<string>();

  constructor(
    private logger: LoggerService,
    private router: Router,
    private alertService: AlertService,
    private generationService: SchedulesGenerationService,
    private stateService: StateService,
    private pdfService: PdfGenerationService
  ) { }

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
    setTimeout(() => {
      // if (!this.data) { // FIXME
      //   this.alertService.showAlert(
      //     'Acção inválida',
      //     'Não é possível andar para a frente. Por favor, preenche os campos de novo.',
      //     'danger');
      //   return;
      // }

      // Generate schedules
      const t0 = performance.now();
      this.generatedSchedules = this.generationService.generateSchedules(this.selectedCourses);
      if (this.generatedSchedules[0]) this.scheduleInViewID = this.generatedSchedules[0].id;
      const t1 = performance.now();
      const generationTime = t1 - t0;
      this.logger.log('generated in (milliseconds)', generationTime);
      this.logger.log('generated schedules', this.generatedSchedules);

      if (this.generatedSchedules.length === 0) {
        this.alertService.showAlert(
          'Sem horários',
          'Não existe nenhum horário possível com estas cadeiras. Remove alguma e tenta de novo.',
          'warning');
        this.goBack();
        return;
      }

      // Fake staling for UX
      generationTime != null && generationTime < 1000 ?
        setTimeout(() => this.spinners.loadingPage = false, 1000) : this.spinners.loadingPage = false;
    }, 0);
  }

  pickViewOption(option: string): void {
    this.spinners.sorting = true;
    switch (option) {
      case 'balanced':
        this.generatedSchedules = this.stateService.hasSchedulesSortedByMostBalanced() ?
          this.stateService.schedulesSortedByMostBalanced :
          this.generationService.sortByMostBalanced(this.generatedSchedules);
        break;

      case 'free-days':
        this.generatedSchedules = this.stateService.hasSchedulesSortedByMostFreeDays() ?
          this.stateService.schedulesSortedByMostFreeDays :
          this.generationService.sortByMostFreeDays(this.generatedSchedules);

        if (this.generationService.generatedSchedulesInfo.get(this.generatedSchedules[0].id).nr_free_days === 0)
          this.alertService.showAlert('Atenção', 'Não existe nenhum horário com dias livres', 'warning');
        break;

      case 'compact':
      default:
        this.generatedSchedules = this.stateService.hasSchedulesSortedByMostCompact() ?
          this.stateService.schedulesSortedByMostCompact :
          this.generationService.sortByMostCompact(this.generatedSchedules);
        break;
    }
    this.spinners.sorting = false;
    this.logger.log('Changed view to ' + option);
  }

  addSchedule(scheduleID: number): void {
    const scheduleIndex = this.findScheduleIndex(scheduleID, this.generatedSchedules);
    const scheduleToAdd = this.generatedSchedules[scheduleIndex];

    if (!this.schedulesPicked.includes(scheduleToAdd)) {
      this.schedulesPicked.push(scheduleToAdd);
    } else {
      this.alertService.showAlert('Atenção', 'Este horário já foi adicionado!', 'warning');
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

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
  }

  @HostListener('window:popstate', [])
  onPopState(): void {
    this.goBack();
  }
}
