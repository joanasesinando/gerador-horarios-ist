import {ClassType} from '../ClassType/ClassType';
import {Lesson} from '../Lesson/Lesson';


export class Shift {
  constructor(
    private _name: string,
    private _type: ClassType,
    private _lessons: Lesson[],
    private _campus: string
  ) {}

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get type(): ClassType { return this._type; }
  set type(value: ClassType) { this._type = value; }

  get lessons(): Lesson[] { return this._lessons; }
  set lessons(value: Lesson[]) { this._lessons = value; }

  get campus(): string { return this._campus; }
  set campus(value: string) { this._campus = value; }

  shiftConverter(): {} { // TODO: complete types
    const lessons: {}[] = [];
    for (const lesson of this.lessons) {
        lessons.push(lesson.lessonConverter());
    }
    return {
        name: this.name,
        type: this.type,
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

  equal(other: Shift): boolean {
    this.lessons.forEach(lesson => {
      let found = false;
      other.lessons.forEach(otherLesson => {
        if (lesson.equal(otherLesson)) { found = true; }
      });
      if (!found) { return false; }
    });
    return this.name === other.name &&
      this.type === other.type &&
      this.campus === other.campus;
  }
}
