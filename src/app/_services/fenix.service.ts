import { Injectable } from '@angular/core';

import {Course, Type} from '../_domain/course';
import {Degree} from '../_domain/degree';


@Injectable({
  providedIn: 'root'
})
export class FenixService {

  constructor() { }

  private static httpGet(url: string): Promise<Response> {
    return fetch(url, {
      method: 'GET'
    });
  }

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
  private static formatType(type: string): Type | string {
    switch (type) {
      case 'TEORICA':
        return Type.TEORICA;

      case 'LABORATORIAL':
        return Type.LABORATORIAL;

      case 'PROBLEMS':
        return Type.PROBLEMAS;

      case 'SEMINARY':
        return Type.SEMINARY;

      case 'TUTORIAL_ORIENTATION':
        return Type.TUTORIAL_ORIENTATION;

      case 'TRAINING_PERIOD':
        return Type.TRAINING_PERIOD;

      default:
        const t = type.toLowerCase();
        return t[0].toUpperCase() + t.substr(1);
    }
  }

  getAcademicTerms(): Promise<string[]> {
    // FIXME: take server out
    return FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/academicterms')
      .then(r => r.json())
      .then(json => {
        return Object.keys(json).sort().reverse().filter((value) => FenixService.validAcademicTerm(value));
      });
  }

  getDegrees(academicTerm: string): Promise<Degree[]> {
    // FIXME: take server out
    return FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=' + academicTerm)
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
    // FIXME: take server out
    return FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/' + degreeId + '/courses?academicTerm=' + academicTerm)
      .then(r => r.json())
      .then(coursesJson => {
        const courses: Course[] = [];

        for (const course of coursesJson) {
          // Remove optional courses (example acronym: O32)
          if (course.acronym[0] === 'O' && course.acronym[1] >= '0'  && course.acronym[1] <= '9') { continue; }

          // Get types of classes for a given course
          let types = [];
          FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/' + course.id + '/schedule')
            .then(r => r.json())
            .then(scheduleJson => {

              for (const cl of scheduleJson.courseLoads) {
                const type = FenixService.formatType(cl.type);
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
