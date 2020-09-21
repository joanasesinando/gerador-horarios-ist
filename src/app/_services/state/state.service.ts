import { Injectable } from '@angular/core';

import {Course} from '../../_domain/Course';
import {Degree} from '../../_domain/Degree';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _academicTermsRepository: string[] = null;
  private _degreesRepository: Map<string, Degree[]>
    = new Map<string, Degree[]>(); // academicTerm -> Degree[]
  private _coursesRepository: Map<string, Map<number, Course[]>>
    = new Map<string, Map<number, Course[]>>(); // academicTerm -> degreeID -> Course[]

  private _academicTermSelected: string = null;
  private _degreeIDSelected: number = null;
  private _selectedCourses: Course[] = null;

  constructor() { }

  get academicTermsRepository(): string[] { return this._academicTermsRepository; }
  set academicTermsRepository(value: string[]) { this._academicTermsRepository = value; }

  get degreesRepository(): Map<string, Degree[]> { return this._degreesRepository; }
  set degreesRepository(value: Map<string, Degree[]>) { this._degreesRepository = value; }

  get coursesRepository(): Map<string, Map<number, Course[]>> { return this._coursesRepository; }
  set coursesRepository(value: Map<string, Map<number, Course[]>>) { this._coursesRepository = value; }

  get selectedCourses(): Course[] { return this._selectedCourses; }
  set selectedCourses(value: Course[]) { this._selectedCourses = value; }

  get academicTermSelected(): string { return this._academicTermSelected; }
  set academicTermSelected(value: string) { this._academicTermSelected = value; }

  get degreeIDSelected(): number { return this._degreeIDSelected; }
  set degreeIDSelected(value: number) { this._degreeIDSelected = value; }

  hasStateSaved(): boolean {
    return this._academicTermsRepository !== null &&
           this._degreesRepository.size !== 0 &&
           this._coursesRepository.size !== 0 &&
           this._academicTermSelected !== null &&
           this._degreeIDSelected !== null;
  }

  hasCourseInDegree(academicTerm: string, degreeID: number, courseID: number): boolean {
    if (this._coursesRepository.has(academicTerm) && this._coursesRepository.get(academicTerm).has(degreeID)) {
      const courses = this._coursesRepository.get(academicTerm).get(degreeID);
      for (const c of courses) {
        if (c.id === courseID) { return true; }
      }
      return false;
    }
  }
}
