import { Injectable } from '@angular/core';

import {Schedule} from '../../_domain/Schedule/Schedule';
import {Class} from '../../_domain/Class/Class';
import {ClassType, minifyClassType} from '../../_domain/ClassType/ClassType';
import {Lesson} from '../../_domain/Lesson/Lesson';

import {TranslateService} from '@ngx-translate/core';
import {formatTime, getTimestamp} from '../../_util/Time';

import { jsPDF } from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {

  constructor(private translateService: TranslateService) { }

  private doc: jsPDF;

  private CELL_HEIGHT = 28.14;
  private GRID_HEIGHT = this.CELL_HEIGHT * 25;
  private GRID_WIDTH = 462.06;
  private CELL_WIDTH = this.GRID_WIDTH / 5;
  private GRID_X_BEGIN = 83.94;
  private GRID_Y_BEGIN = 90;

  private static getTimelineHours(start: number, end: number): string[] {
    const timeline: string[] = [];
    let current = start;

    while (current !== end + 1) {
      let s = '';
      if (current.toString().length === 1) s += '0';
      s += current + ':00';
      timeline.push(s);
      current++;
    }
    return timeline;
  }

  private static getLessonTimes(lesson: Lesson): string {
    return formatTime(lesson.start) + ' - ' + formatTime(lesson.end);
  }

  private static getLessonName(type: ClassType, acronym: string): string {
    return acronym.replace(/[0-9]/g, '') + ' (' + minifyClassType(type) + ')';
  }

  generateSchedulesPdf(schedules: Schedule[], colors: {[tag: number]: string}): void {
    this.createPdf();
    schedules.forEach(schedule => this.drawSchedule(schedule, colors));
    this.savePdf();
  }

  private createPdf(): void {
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

  private savePdf(): void {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    let fileName;

    switch (this.translateService.currentLang) {
      case 'pt-PT':
        fileName = 'IST-horarios-' + date + '-' + time + '.pdf';
        break;

      case 'en-GB':
      default:
        fileName = 'IST-schedules-' + date + '-' + time + '.pdf';
        break;
    }
    this.doc.save(fileName);
  }

  private drawSchedule(schedule: Schedule, colors: {[tag: number]: string}): void {
    this.doc.addPage();
    this.drawTitle(schedule.id + 1);
    this.drawGrid();
    this.drawWeekdays();
    this.drawTimelineHours();
    this.drawClasses(schedule.classes, colors);
  }

  private drawTitle(scheduleID: number): void {
    this.doc.setFontSize(16);
    const title = this.getTitle(scheduleID);
    const xOffset = (this.doc.internal.pageSize.width / 2) - (this.doc.getStringUnitWidth(title) * this.doc.getFontSize() / 2);
    this.drawText({ r: 0, g: 159, b: 227}, 'Poppins', 'semi-bold', 16, title, xOffset, 62);
  }

  private drawGrid(): void {
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

  private drawWeekdays(): void {
    let weekdays: string[];
    switch (this.translateService.currentLang) {
      case 'pt-PT':
        weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        break;

      case 'en-GB':
      default:
        weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        break;
    }

    const yOffset = this.GRID_Y_BEGIN + this.CELL_HEIGHT / 2 + 4;
    for (let i = 0; i < weekdays.length; i++) {
      this.doc.setFontSize(11);
      const weekday = weekdays[i];
      const xOffset = this.GRID_X_BEGIN + (this.CELL_WIDTH * i) + (this.CELL_WIDTH / 2) -
        (this.doc.getStringUnitWidth(weekday) * this.doc.getFontSize() / 2);
      this.drawText({ r: 0, g: 0, b: 0}, 'Poppins', 'semi-bold', 11, weekday, xOffset, yOffset);
    }
  }

  private drawTimelineHours(): void {
    const xOffset = 50;
    const yOffset = this.GRID_Y_BEGIN + this.CELL_HEIGHT + 3;
    const times = PdfGenerationService.getTimelineHours(8, 20);

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('Poppins', 'regular');
    this.doc.setFontSize(8.5);

    this.doc.text(times[0], xOffset, yOffset);
    for (let i = 1; i < times.length; i++) {
      this.doc.text(times[i], xOffset, yOffset + this.CELL_HEIGHT * 2 * i);
    }
  }

  private drawClasses(classes: Class[], colors: {[tag: number]: string}): void {
    // Parse colors to RGB
    const colorsRGB: {[tag: number]: {r: number, g: number, b: number}} = {};
    for (const [tag, color] of Object.entries(colors)) {
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5), 16);
      colorsRGB[tag] = {r, g, b};
    }

    for (let i = 0; i < classes.length; i++) {
      const color = colorsRGB[i + 1];
      const cl = classes[i];

      cl.shifts.forEach(shift => {
        shift.lessons.forEach(lesson => {
          this.drawLesson(lesson, shift.type, cl, color);
        });
      });
    }
  }

  private drawLesson(lesson: Lesson, type: ClassType, cl: Class, color: {r, g, b}): void {
    const xOffset = this.getLessonXOffset(lesson);
    const yOffset = this.getLessonYOffset(lesson);
    const height = this.getLessonHeight(lesson);

    // Fill slot
    this.doc.setFillColor(color.r, color.g, color.b);
    this.doc.rect(xOffset, yOffset, this.CELL_WIDTH, height, 'F');

    // Draw separation line
    this.doc.setDrawColor(color.r - 30, color.g - 30, color.b - 30);
    this.doc.setLineWidth(2);
    this.doc.line(xOffset, yOffset + height - 1, xOffset + this.CELL_WIDTH, yOffset + height - 1);

    // Draw text
    const textXOffset = xOffset + 6;
    const textYOffset = yOffset + 12;

    this.drawText({r: 255, g: 255, b: 255}, 'Poppins', 'medium', 7.5,
      PdfGenerationService.getLessonTimes(lesson), textXOffset, textYOffset);
    this.drawText({r: 255, g: 255, b: 255}, 'Poppins', 'semi-bold', 9,
      PdfGenerationService.getLessonName(type, cl.course.acronym), textXOffset, textYOffset + 14);
    this.drawText({r: 255, g: 255, b: 255}, 'Poppins', 'medium', 8,
      lesson.room, textXOffset, textYOffset + 30);
  }

  private drawText(color: {r, g, b}, fontName: string, fontStyle: string, fontSize: number,
                   text: string, xOffset: number, yOffset: number): void {

    this.doc.setTextColor(color.r, color.g, color.b);
    this.doc.setFont(fontName, fontStyle);
    this.doc.setFontSize(fontSize);
    this.doc.text(text, xOffset, yOffset);
  }

  private getTitle(scheduleID: number): string {
    switch (this.translateService.currentLang) {
      case 'pt-PT':
        return 'Horário #' + scheduleID;

      case 'en-GB':
      default:
        return 'Schedule #' + scheduleID;
    }
  }

  private getLessonXOffset(lesson: Lesson): number {
    const weekday = lesson.start.getDay();
    return this.GRID_X_BEGIN + this.CELL_WIDTH * (weekday - 1);
  }

  private getLessonYOffset(lesson: Lesson): number {
    const timelineUnitDuration = 30;
    const base = this.GRID_Y_BEGIN + this.CELL_HEIGHT;
    const start = getTimestamp(formatTime(lesson.start));
    return base + this.CELL_HEIGHT * (start - getTimestamp('08:00')) / timelineUnitDuration;
  }

  private getLessonHeight(lesson: Lesson): number {
    const timelineUnitDuration = 30;
    const start = getTimestamp(formatTime(lesson.start));
    const duration = getTimestamp(formatTime(lesson.end)) - start;
    return this.CELL_HEIGHT * duration / timelineUnitDuration;
  }
}
