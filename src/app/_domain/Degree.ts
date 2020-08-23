export class Degree {
  constructor(public _id: number, public _name: string, public _acronym: string) {}

  // Firestore data converter
  degreeConverter = {
    toFirestore: (degree: Degree) => {
      return {
        id: degree.id,
        name: degree.name,
        acronym: degree.acronym,
      };
    },
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return new Degree(data.id, data.name, data.acronym);
    }
  };

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; }

  get acronym(): string { return this._acronym; }
  set acronym(value: string) { this._acronym = value; }
}
