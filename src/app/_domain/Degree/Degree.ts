export class Degree {
  constructor(private _id: number, private _name: string, private _acronym: string) {}

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }
}

// Firestore data converter
export const degreeConverter = {
  toFirestore: (degree: Degree) => {
    return {
      id: degree.id,
      name: degree.name,
      acronym: degree.acronym,
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Degree(parseInt(data.id, 10), data.name, data.acronym);
  }
};
