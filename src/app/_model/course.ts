export class Degree {
  // tslint:disable-next-line:variable-name
  constructor(public _id: number, public _name: string, public _acronym: string) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }
}

export class Course {
  // tslint:disable-next-line:variable-name
  constructor(public _id: number, public _name: string, public _acronym: string, public _types: Types[]) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }

  get types(): Types[] { return this._types; }
  set types(value: Types[]) { this._types = value; }
}

export enum Types {
  TEORICA = 'Teórica',
  LABORATORIAL = 'Laboratorial',
  PROBLEMAS = 'Problemas',
  SEMINARY = 'Seminário',
  TUTORIAL_ORIENTATION = 'Tutorial Orientation',
  TRAINING_PERIOD = 'Training Period'
}
