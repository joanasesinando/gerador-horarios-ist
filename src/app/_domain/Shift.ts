import {ClassType} from './ClassType';
import {Lesson} from './Lesson';


export class Shift {
    constructor(
      private _name: string,
      private _types: ClassType[],
      private _lessons: Lesson[],
      private _campus: string) {}

    get name(): string { return this._name; }
    set name(value: string) { this._name = value; }

    get types(): ClassType[] { return this._types; }
    set types(value: ClassType[]) { this._types = value; }

    get lessons(): Lesson[] { return this._lessons; }
    set lessons(value: Lesson[]) { this._lessons = value; }

    get campus(): string { return this._campus; }
    set campus(value: string) { this._campus = value; }

    shiftConverter(): {} {
        const lessons: {}[] = [];
        for (const lesson of this.lessons) {
            lessons.push(lesson.lessonConverter());
        }
        return {
            name: this.name,
            types: this.types,
            lessons,
            campus: this.campus
        };
    }

  overlap(other: Shift): boolean {
    for (const lesson of this.lessons) {
      for (const otherLesson of other.lessons) {
        if (lesson.overlap(otherLesson)) { return true; }
      }
    }
    return false;
  }

}
