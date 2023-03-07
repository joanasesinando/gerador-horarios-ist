import {ClassType} from '../ClassType/ClassType';
import {Shift} from '../Shift/Shift';
import {Degree} from '../Degree/Degree';


export class Course {
  constructor(
    private _id: number,
    private _name: string,
    private _acronym: string,
    private _credits: number,
    private _semester: number,
    private _period: string,
    private _types?: ClassType[],
    private _campus?: string[],
    private _shifts?: Shift[],
    private _courseLoads?: {},
    private _degree?: Degree // degree this course was selected from
  ) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }

  get credits(): number { return this._credits; }
  set credits(value: number) { this._credits = value; }

  get semester(): number { return this._semester; }
  set semester(value: number) { this._semester = value; }

  get period(): string { return this._period; }
  set period(value: string) { this._period = value; }

  get types(): ClassType[] { return this._types; }
  set types(value: ClassType[]) { this._types = value; }

  get campus(): string[] { return this._campus; }
  set campus(value: string[]) { this._campus = value; }

  get shifts(): Shift[] { return this._shifts; }
  set shifts(value: Shift[]) { this._shifts = value; }

  get courseLoads(): {}  { return this._courseLoads; }
  set courseLoads(value: {}) { this._courseLoads = value; }

  get degree(): Degree  { return this._degree; }
  set degree(value: Degree) { this._degree = value; }

  hasFullInfo(): boolean {
    return this.types !== undefined &&
      this.campus !== undefined &&
      this.shifts !== undefined &&
      this.courseLoads !== undefined;
  }

  formatAcronym(): string {
    return this.acronym.replace(/[0-9-]+$/g, '');
  }
}
