export enum Type {
  THEORY_PT = 'Teórica',
  LAB_PT = 'Laboratorial',
  PROBLEMS_PT = 'Problemas',
  SEMINARY_PT = 'Seminário',
  THEORY_EN = 'Theoretical',
  LAB_EN = 'Laboratory',
  PROBLEMS_EN = 'Problems',
  SEMINARY_EN = 'Seminary',
  TUTORIAL_ORIENTATION = 'Tutorial Orientation',
  TRAINING_PERIOD = 'Training Period'
}

export class Course {
  constructor(
    public _id: number,
    public _name: string,
    public _acronym: string,
    public _types?: Type[],
    public _campus?: string[],
    public _shifts?: Shift[]
    // TODO: feriados na primeira semana
  ) {}

  // Firestore data converter
  courseConverterBasicInfo = {
    toFirestore: (course: Course) => {
      return {
        id: course.id,
        name: course.name,
        acronym: course.acronym
      };
    },
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return new Course(data.id, data.name, data.acronym);
    }
  };

  // Firestore data converter
  typeConverter(): string[] {
    const types: string[] = [];
    console.log(this.types);
    for (const type of this.types) {
      types.push(type);
    }
    return types;
  }

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }

  get types(): Type[] { return this._types; }
  set types(value: Type[]) { this._types = value; }

  get campus(): string[] { return this._campus; }
  set campus(value: string[]) { this._campus = value; }

  get shifts(): Shift[] { return this._shifts; }
  set shifts(value: Shift[]) { this._shifts = value; }

  hasFullInfo(): boolean {
    return this.types !== undefined || this.campus !== undefined || this.shifts !== undefined;
  }
}

export class Shift {
  constructor(public _name: string, public _types: Type[], public _lessons: Lesson[]) {}

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get types(): Type[] { return this._types; }
  set types(value: Type[]) { this._types = value; }

  get lessons(): Lesson[] { return this._lessons; }
  set lessons(value: Lesson[]) { this._lessons = value; }
}

export class Lesson {
  constructor(public _start: Date, public _end: Date, public _room: string, public _campus: string) {}

  get start(): Date { return this._start; }
  set start(value: Date) { this._start = value; }

  get end(): Date { return this._end; }
  set end(value: Date) { this._end = value; }

  get room(): string { return this._room; }
  set room(value: string) { this._room = value; }

  get campus(): string { return this._campus; }
  set campus(value: string) { this._campus = value; }
}
