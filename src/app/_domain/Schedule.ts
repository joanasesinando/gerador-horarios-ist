import {Class} from './Class';


export class Schedule {
  constructor(private _classes: Class[]) {}

  get classes(): Class[] { return this._classes; }
  set classes(value: Class[]) { this._classes = value; }
}
