import * as firebase from 'firebase/app';
import 'firebase/firestore';

import {formatTime, getMinifiedWeekday} from '../_util/Time';


export class Lesson {
    constructor(private _start: Date, private _end: Date, private _room: string, private _campus: string) {}

    get start(): Date { return this._start; }
    set start(value: Date) { this._start = value; }

    get end(): Date { return this._end; }
    set end(value: Date) { this._end = value; }

    get room(): string { return this._room; }
    set room(value: string) { this._room = value; }

    get campus(): string { return this._campus; }
    set campus(value: string) { this._campus = value; }

    lessonConverter(): {} {
        return {
            start: firebase.firestore.Timestamp.fromDate(this.start),
            end: firebase.firestore.Timestamp.fromDate(this.end),
            room: this.room,
            campus: this.campus
        };
    }

    overlap(other: Lesson): boolean {
      function convertDateToTime(date: Date): number {
        const min = date.getMinutes() === 0 ? 0 : (date.getMinutes() * 0.5) / 30;
        return date.getHours() + min;
      }

      const weekDay = this.start.getDay();
      const startTime = convertDateToTime(this.start);
      const endTime = convertDateToTime(this.end);

      const otherWeekDay = other.start.getDay();
      const otherStartTime = convertDateToTime(other.start);
      const otherEndTime = convertDateToTime(other.end);

      return weekDay === otherWeekDay && (
             (startTime >= otherStartTime && startTime < otherEndTime) ||
             (otherStartTime >= startTime && otherStartTime < endTime) ||
             (endTime > otherStartTime && endTime <= otherEndTime) ||
             (otherEndTime > startTime && otherEndTime <= endTime)
      );
    }

    print(language: string): string {
      let s = '';
      const weekday = this.start.getDay();

      if (language === 'pt-PT') {
        s += getMinifiedWeekday(weekday, 'pt-PT');
      } else {
        s += getMinifiedWeekday(weekday, 'en-GB');
      }

      s += ', ' + formatTime(this.start) + ' - ' + formatTime(this.end);
      return s;
    }

    equal(other: Lesson): boolean {
      return this.start.getDay() === other.start.getDay() &&
        formatTime(this.start) === formatTime(other.start) &&
        this.end.getDay() === other.end.getDay() &&
        formatTime(this.end) === formatTime(other.end) &&
        this.room === other.room &&
        this.campus === other.campus;
    }
}
