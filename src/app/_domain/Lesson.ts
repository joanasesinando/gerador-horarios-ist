import * as firebase from 'firebase/app';
import 'firebase/firestore';


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
}
