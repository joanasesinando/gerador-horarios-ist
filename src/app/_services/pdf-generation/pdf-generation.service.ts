import { Injectable } from '@angular/core';

import { jsPDF } from 'jspdf';
import {TranslateService} from '@ngx-translate/core';

import {Schedule} from '../../_domain/Schedule';
import {Class} from '../../_domain/Class';
import {Course} from '../../_domain/Course';
import {ClassType} from '../../_domain/ClassType';
import {Shift} from '../../_domain/Shift';
import {Lesson} from '../../_domain/Lesson';

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {

  doc: jsPDF;

  CELL_HEIGHT = 28.14;
  GRID_HEIGHT = this.CELL_HEIGHT * 25;
  GRID_WIDTH = 462.06;
  CELL_WIDTH = this.GRID_WIDTH / 5;
  GRID_X_BEGIN = 83.94;
  GRID_Y_BEGIN = 90;

  COURSES: Course[] = [ // FIXME: remove
    new Course(1, 'Course #1', 'C1', [ClassType.THEORY_PT, ClassType.LAB_PT], ['Alameda'],
      [
        new Shift('T01', ClassType.THEORY_PT, [
          new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
          new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
        ], 'Alameda'),
        new Shift('L01', ClassType.LAB_PT, [
          new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
        ], 'Alameda')
      ], { TEORICA: 3, LABORATORIAL: 1.5 }),
    new Course(2, 'Course #2', 'C2', [ClassType.THEORY_PT], ['Taguspark'],
      [
        new Shift('T01', ClassType.THEORY_PT, [
          new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Taguspark'),
          new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Taguspark')
        ], 'Taguspark')
      ], { TEORICA: 3 }),
    new Course(3, 'Course #3', 'C3', [ClassType.THEORY_PT, ClassType.PROBLEMS_PT], ['Alameda'],
      [
        new Shift('T01', ClassType.THEORY_PT, [
          new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'R1', 'Alameda'),
          new Lesson(new Date('2020-09-09 09:30'), new Date('2020-09-09 11:00'), 'R1', 'Alameda')
        ], 'Alameda'),
        new Shift('PB01', ClassType.PROBLEMS_PT, [
          new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-07 11:00'), 'R2', 'Alameda')
        ], 'Alameda')
      ], { TEORICA: 3, PROBLEMS: 1.5 })
  ];

  SCHEDULES: Schedule[] = [ // FIXME: remove
    new Schedule(1, [
      new Class(this.COURSES[0], this.COURSES[0].shifts)
    ]),
    new Schedule(2, [
      new Class(this.COURSES[1], this.COURSES[1].shifts)
    ])
  ];

  constructor(private translateService: TranslateService) { }

  createPdf(): void {
    this.doc = new jsPDF({
      unit: 'pt'
    });
    this.doc.deletePage(1);

    // Add custom font - Poppins
    this.doc.addFont('assets/fonts/Poppins/Poppins-Regular.ttf', 'Poppins', 'regular');
    this.doc.addFont('assets/fonts/Poppins/Poppins-Medium.ttf', 'Poppins', 'medium');
    this.doc.addFont('assets/fonts/Poppins/Poppins-SemiBold.ttf', 'Poppins', 'semi-bold');
    this.doc.addFont('assets/fonts/Poppins/Poppins-Bold.ttf', 'Poppins', 'bold');
  }

  generateSchedulesPdf(schedules: Schedule[]): void {
    this.createPdf();
    this.SCHEDULES.forEach(schedule => this.drawSchedule(schedule)); // FIXME: change to schedules
    this.doc.save('test.pdf'); // FIXME: change name
  }

  drawSchedule(schedule: Schedule): void {
    this.doc.addPage();
    this.drawTitle(schedule.id);
    this.drawGrid();
    this.drawTimelineHours();
    // TODO: classes
  }

  drawTitle(scheduleID: number): void {
    const title = this.getTitle(scheduleID);
    const xOffset = (this.doc.internal.pageSize.width / 2) - (this.doc.getStringUnitWidth(title) * this.doc.getFontSize() / 2);

    this.doc.setTextColor(0, 159, 227);
    this.doc.setFont('Poppins', 'semi-bold');
    this.doc.setFontSize(16);
    this.doc.text(title, xOffset, 62);
  }

  getTitle(scheduleID: number): string {
    switch (this.translateService.currentLang) {
      case 'pt-PT':
        return 'Horário #' + scheduleID;

      case 'en-GB':
      default:
        return 'Schedule #' + scheduleID;
    }
  }

  drawGrid(): void {
    this.doc.setDrawColor(234, 234, 234);
    this.doc.setLineWidth(0.71);
    this.doc.rect(this.GRID_X_BEGIN, this.GRID_Y_BEGIN, this.GRID_WIDTH, this.GRID_HEIGHT);

    // Draw horizontal lines
    for (let i = 1; i <= 25; i++) {
      this.doc.line(
        this.GRID_X_BEGIN,
        this.GRID_Y_BEGIN + this.CELL_HEIGHT * i,
        this.GRID_X_BEGIN + this.GRID_WIDTH,
        this.GRID_Y_BEGIN + this.CELL_HEIGHT * i
      );
    }

    // Draw vertical lines
    for (let i = 1; i <= 5; i++) {
      this.doc.line(
        this.GRID_X_BEGIN + this.CELL_WIDTH * i,
        this.GRID_Y_BEGIN,
        this.GRID_X_BEGIN + this.CELL_WIDTH * i,
        this.GRID_Y_BEGIN + this.GRID_HEIGHT
      );
    }
  }

  drawTimelineHours(): void {
    const xOffset = 50;
    const yOffset = this.GRID_Y_BEGIN + this.CELL_HEIGHT + 3;
    const times = this.getTimelineHours(8, 20);

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('Poppins', 'regular');
    this.doc.setFontSize(8.5);

    this.doc.text(times[0], xOffset, yOffset);
    for (let i = 1; i < times.length; i++) {
      this.doc.text(times[i], xOffset, yOffset + this.CELL_HEIGHT * 2 * i);
    }
  }

  getTimelineHours(start: number, end: number): string[] {
    const timeline: string[] = [];
    let current = start;

    while (current !== end + 1) {
      let s = '';
      if (current.toString().length === 1) { s += '0'; }
      s += current + ':00';
      timeline.push(s);
      current++;
    }
    return timeline;
  }

  drawClasses(): void {

  }

  drawClass(): void {

  }
}
