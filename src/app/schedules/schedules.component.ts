import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {LoggerService} from '../_util/logger.service';
import {AlertService} from '../_util/alert.service';
import {SchedulesGenerationService} from '../_services/schedules-generation.service';

import {Course} from '../_domain/Course';
import {Schedule} from '../_domain/Schedule';
import {Lesson} from '../_domain/Lesson';
import {Shift} from '../_domain/Shift';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit, AfterViewInit {

  generatedSchedules: Schedule[] = [];
  selectedCourses: Course[] = [];

  scheduleInView = 0;
  schedulesPicked: Schedule[] = [];

  spinner = true;
  generationTime: number = null;

  mobileView = false;

  constructor(
    private logger: LoggerService,
    private router: Router,
    private alertService: AlertService,
    private schedulesGenerationService: SchedulesGenerationService) { }

  ngOnInit(): void {
    this.onWindowResize();
    // Receive selected courses
    const data = history.state.data;
    if (!data) { this.router.navigate(['/']); return; }
    this.selectedCourses = this.parseCourses(data);
    this.logger.log('courses to generate', this.selectedCourses);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Generate schedules
      const t0 = performance.now();
      this.generatedSchedules = this.schedulesGenerationService.generateSchedules(this.selectedCourses);
      const t1 = performance.now();
      this.generationTime = (t1 - t0) / 100;
      this.logger.log('generated in (seconds)', this.generationTime);
      this.logger.log('generated schedules', this.generatedSchedules);

      if (this.generatedSchedules.length === 0) {
        this.alertService.showAlert(
          'Sem horários',
          'Não existe nenhum horário possível com todas estas cadeiras. Remove alguma e tenta de novo.',
          'warning');
        this.router.navigate(['/']);
        return;
      }

      // Fake staling for UX
      this.generationTime != null && this.generationTime < 1000 ?
        setTimeout(() => this.spinner = false, 1000) : this.spinner = false;
    }, 0);
  }

  parseCourses(data: {_id, _name, _acronym, _types, _campus, _shifts, _courseLoads}[]): Course[] {
    const courses: Course[] = [];
    for (const obj of data) {
      const course = new Course(obj._id, obj._name, obj._acronym, obj._types, obj._campus);

      // Parse shifts
      const shifts: Shift[] = [];
      if (obj._shifts && obj._shifts !== []) {
        for (const shift of obj._shifts) {
          const lessons: Lesson[] = [];
          for (const lesson of shift._lessons) {
            lessons.push(new Lesson(new Date(lesson._start), new Date(lesson._end), lesson._room, lesson._campus));
          }
          shifts.push(new Shift(shift._name, shift._types, lessons, shift._campus));
        }
      }
      course.shifts = shifts;

      course.courseLoads = obj._courseLoads;
      courses.push(course);
    }
    return courses;
  }

  pickShowOption(event): void {
    // TODO
    console.log(event.innerText);
  }

  addSchedule(scheduleID: number): void {
    const scheduleToAdd = this.generatedSchedules[scheduleID];
    if (!this.schedulesPicked.includes(scheduleToAdd)) {
      this.schedulesPicked.push(scheduleToAdd);
    } else {
      this.alertService.showAlert('Atenção', 'Este horário já foi adicionado!', 'warning');
    }
    this.logger.log('schedules picked', this.schedulesPicked);
  }

  removeSchedule(scheduleID: number): void {
    const scheduleToRemove = this.generatedSchedules[scheduleID];
    if (this.schedulesPicked.includes(scheduleToRemove)) {
      this.schedulesPicked.splice(this.schedulesPicked.indexOf(scheduleToRemove), 1);
    }
    this.logger.log('schedules picked', this.schedulesPicked);
  }

  finish(): void {
    // TODO
    this.alertService.showAlert(
      'Brevemente 😄',
      'Esta funcionalidade está ainda em desenvolvimento. Se quiseres contribuir passa pelo repositório no Github!',
      'info');
    console.log('finish');
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.mobileView = window.innerWidth <= 991.98; // phones & tablets
  }
}
