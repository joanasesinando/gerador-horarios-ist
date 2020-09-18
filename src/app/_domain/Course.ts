import {ClassType} from './ClassType';
import {Shift} from './Shift';
import {Lesson} from './Lesson';


export class Course {
  constructor(
    private _id: number,
    private _name: string,
    private _acronym: string,
    private _types?: ClassType[],
    private _campus?: string[],
    private _shifts?: Shift[],
    private _courseLoads?: {}
  ) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }

  get types(): ClassType[] { return this._types; }
  set types(value: ClassType[]) { this._types = value; }

  get campus(): string[] { return this._campus; }
  set campus(value: string[]) { this._campus = value; }

  get shifts(): Shift[] { return this._shifts; }
  set shifts(value: Shift[]) { this._shifts = value; }

  get courseLoads(): {}  { return this._courseLoads; }
  set courseLoads(value: {}) { this._courseLoads = value; }

  hasFullInfo(): boolean {
    return this.types !== undefined || this.campus !== undefined || this.shifts !== undefined;
  }

  convertShifts(): {}[] {
    const shifts: {}[] = [];
    for (const shift of this.shifts) {
      shifts.push(shift.shiftConverter());
    }
    return shifts;
  }
}

// Firestore data converter
export const courseConverter = {
  toFirestore: (course: Course) => {
    return {
      id: course.id,
      name: course.name,
      acronym: course.acronym
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    if (data.types && data.campus && data.shifts && data.courseLoads) {
      const shifts: Shift[] = [];
      for (const shift of data.shifts) {
        const lessons: Lesson[] = [];
        for (const lesson of shift.lessons) {
          const start = lesson.start.toDate();
          const end = lesson.end.toDate();
          lessons.push(new Lesson(start, end, lesson.room, lesson.campus));
        }
        shifts.push(new Shift(shift.name, shift.type, lessons, shift.campus));
      }
      return new Course(data.id, data.name, data.acronym, data.types, data.campus, shifts, data.courseLoads);
    }
    return new Course(data.id, data.name, data.acronym);
  }
};

export function parseCourses(data: {_id, _name, _acronym, _types, _campus, _shifts, _courseLoads}[]): Course[] {
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
        shifts.push(new Shift(shift._name, shift._type, lessons, shift._campus));
      }
    }
    course.shifts = shifts;

    course.courseLoads = obj._courseLoads;
    courses.push(course);
  }
  return courses;
}
