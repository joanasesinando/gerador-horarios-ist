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
  // tslint:disable-next-line:variable-name
  constructor(public _id: number, public _name: string, public _acronym: string, public _types: Type[]) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }

  get types(): Type[] { return this._types; }
  set types(value: Type[]) { this._types = value; }
}
