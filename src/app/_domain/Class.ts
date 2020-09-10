import {Course} from './Course';
import {Shift} from './Shift';

export class Class {
  constructor(private _course: Course, private _shifts: Shift[]) {}

  get course(): Course { return this._course; }
  set course(value: Course) { this._course = value; }

  get shifts(): Shift[] { return this._shifts; }
  set shifts(value: Shift[]) { this._shifts = value; }

  toString(): string {
    let s = '';
    for (const shift of this._shifts) {
      s += shift.name + ' ';
    }
    return s;
  }

  overlap(other: Class): boolean {
    for (const shift of this.shifts) {
      for (const otherShift of other.shifts) {
        if (shift.overlap(otherShift)) { return true; }
      }
    }
    return false;
  }
}
