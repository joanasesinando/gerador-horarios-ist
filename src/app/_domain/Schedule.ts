import {Class} from './Class';


export class Schedule {
  constructor(private _id: number, private _classes: Class[]) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get classes(): Class[] { return this._classes; }
  set classes(value: Class[]) { this._classes = value; }
}
