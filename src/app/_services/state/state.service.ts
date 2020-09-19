import { Injectable } from '@angular/core';

import {Course} from '../../_domain/Course';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _selectedCourses: Course[] = null;
  private _selectedCoursesFullInfo: Course[] = null;
  private _academicTermSelected: string = null;
  private _degreeIDSelected: number = null;

  constructor() { }

  get selectedCourses(): Course[] { return this._selectedCourses; }
  set selectedCourses(value: Course[]) { this._selectedCourses = value; }

  get selectedCoursesFullInfo(): Course[] { return this._selectedCoursesFullInfo; }
  set selectedCoursesFullInfo(value: Course[]) { this._selectedCoursesFullInfo = value; }

  get academicTermSelected(): string { return this._academicTermSelected; }
  set academicTermSelected(value: string) { this._academicTermSelected = value; }

  get degreeIDSelected(): number { return this._degreeIDSelected; }
  set degreeIDSelected(value: number) { this._degreeIDSelected = value; }

  hasStateSaved(): boolean {
    return this._selectedCoursesFullInfo !== null && this._academicTermSelected !== null && this._degreeIDSelected !== null;
  }
}
