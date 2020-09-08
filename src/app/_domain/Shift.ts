import {ClassType} from './ClassType';
import {Lesson} from './Lesson';


export class Shift {
    constructor(private _name: string, private _types: ClassType[], private _lessons: Lesson[]) {}

    get name(): string { return this._name; }
    set name(value: string) { this._name = value; }

    get types(): ClassType[] { return this._types; }
    set types(value: ClassType[]) { this._types = value; }

    get lessons(): Lesson[] { return this._lessons; }
    set lessons(value: Lesson[]) { this._lessons = value; }

    shiftConverter(): {} {
        const lessons: {}[] = [];
        for (const lesson of this.lessons) {
            lessons.push(lesson.lessonConverter());
        }
        return {
            name: this.name,
            types: this.types,
            lessons
        };
    }
}
