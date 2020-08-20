import { Injectable } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {Course, Type} from '../_domain/course';
import {Degree} from '../_domain/degree';


@Injectable({
  providedIn: 'root'
})
export class FenixService {

  // FIXME: take server out
  url = 'https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/';

  constructor(public translateService: TranslateService) { }

  /* ------------------------------------------------------------
   * Returns true if academicTerm is bigger or equal to 2003/2004
   * and is not the next term. Otherwise, return false.
   * (Reason being that there's not enough info on degrees/courses
   * to generate schedules otherwise.
   * ------------------------------------------------------------ */
  private static validAcademicTerm(academicTerm: string): boolean {
    let currentTerm = new Date().getFullYear();
    return academicTerm >= '2003/2004' && academicTerm !== ++currentTerm + '/' + ++currentTerm;
  }

  /* ------------------------------------------------------------
   * Formats the type of class to one that's more readable
   * ------------------------------------------------------------ */
  private formatType(type: string): Type | string {
    switch (type) {
      case 'TEORICA':
        if (this.translateService.currentLang === 'pt-PT') { return Type.THEORY_PT; }
        return Type.THEORY_EN;

      case 'LABORATORIAL':
        if (this.translateService.currentLang === 'pt-PT') { return Type.LAB_PT; }
        return Type.LAB_EN;

      case 'PROBLEMS':
        if (this.translateService.currentLang === 'pt-PT') { return Type.PROBLEMS_PT; }
        return Type.PROBLEMS_EN;

      case 'SEMINARY':
        if (this.translateService.currentLang === 'pt-PT') { return Type.SEMINARY_PT; }
        return Type.SEMINARY_EN;

      case 'TUTORIAL_ORIENTATION':
        return Type.TUTORIAL_ORIENTATION;

      case 'TRAINING_PERIOD':
        return Type.TRAINING_PERIOD;

      default:
        const t = type.toLowerCase();
        return t[0].toUpperCase() + t.substr(1);
    }
  }

  private getLanguage(): string {
    return this.translateService.currentLang;
  }

  private httpGet(path: string): Promise<Response> {
    return fetch(this.url + path, {
      method: 'GET'
    });
  }

  getAcademicTerms(): Promise<string[]> {
    return this.httpGet('academicterms?lang=' + this.getLanguage())
      .then(r => r.json())
      .then(json => {
        return Object.keys(json).sort().reverse().filter((value) => FenixService.validAcademicTerm(value));
      });
  }

  getDegrees(academicTerm: string): Promise<Degree[]> {
    return this.httpGet('degrees?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(json => {
        const degrees: Degree[] = [];
        for (const j of json) {
          degrees.push(new Degree(j.id, j.name, j.acronym));
        }
        return degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getCourses(academicTerm: string, degreeId: string): Promise<Course[]> {
    return this.httpGet('degrees/' + degreeId + '/courses?academicTerm=' + academicTerm + '&lang=' + this.getLanguage())
      .then(r => r.json())
      .then(coursesJson => {
        const courses: Course[] = [];

        for (const course of coursesJson) {
          // Remove optional courses (example acronym: O32)
          if (course.acronym[0] === 'O' && course.acronym[1] >= '0'  && course.acronym[1] <= '9') { continue; }

          // Get types of classes for a given course
          let types = [];
          this.httpGet('courses/' + course.id + '/schedule' + '?lang=' + this.getLanguage())
            .then(r => r.json())
            .then(scheduleJson => {

              for (const cl of scheduleJson.courseLoads) {
                const type = this.formatType(cl.type);
                types.push(type);
              }
              types = types.reverse();
            });

          courses.push(new Course(course.id, course.name, course.acronym, types));
        }

        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }
}
