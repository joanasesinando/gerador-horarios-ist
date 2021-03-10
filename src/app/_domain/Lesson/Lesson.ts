import firebase from 'firebase/app';

import {formatTime, getMinifiedWeekday, getTimestamp} from '../../_util/Time';


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

    lessonConverter(): {start: firebase.firestore.Timestamp, end: firebase.firestore.Timestamp, room: string, campus: string} {
        return {
            start: firebase.firestore.Timestamp.fromDate(this.start),
            end: firebase.firestore.Timestamp.fromDate(this.end),
            room: this.room,
            campus: this.campus
        };
    }

    overlap(other: Lesson): boolean {
      const weekDay = this.start.getDay();
      const startTime = getTimestamp(formatTime(this.start));
      const endTime = getTimestamp(formatTime(this.end));

      const otherWeekDay = other.start.getDay();
      const otherStartTime = getTimestamp(formatTime(other.start));
      const otherEndTime = getTimestamp(formatTime(other.end));

      return weekDay === otherWeekDay && (
             (startTime >= otherStartTime && startTime < otherEndTime) ||
             (otherStartTime >= startTime && otherStartTime < endTime) ||
             (endTime > otherStartTime && endTime <= otherEndTime) ||
             (otherEndTime > startTime && otherEndTime <= endTime)
      );
    }

    print(language: string): string {
      const weekday = this.start.getDay();
      const minifiedWeekday = language === 'pt-PT' ? getMinifiedWeekday(weekday, 'pt-PT') : getMinifiedWeekday(weekday, 'en-GB');
      return minifiedWeekday + ', ' + formatTime(this.start) + ' - ' + formatTime(this.end);
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
