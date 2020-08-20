import { Injectable } from '@angular/core';
import {Course, Degree, Types} from '../_model/course';


@Injectable({
  providedIn: 'root'
})
export class FenixService {

  constructor() {
  }

  private static httpGet(url: string): Promise<Response> {
    return fetch(url, {
      method: 'GET'
    });
  }

  private static validAcademicYear(value): boolean {
    let currentYear = new Date().getFullYear();
    return value >= '2003/2004' && value !== ++currentYear + '/' + ++currentYear;
  }

  getAcademicYears(): Promise<string[]> {
    // FIXME: take server out
    return FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/academicterms')
      .then(r => r.json())
      .then(json => {
        return Object.keys(json).sort().reverse().filter((value) => FenixService.validAcademicYear(value));
      });
  }

  getDegrees(academicYear: string): Promise<Degree[]> {
    // FIXME: take server out
    return FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=' + academicYear)
      .then(r => r.json())
      .then(json => {
        const degrees: Degree[] = [];
        for (const j of json) {
          degrees.push(new Degree(j.id, j.name, j.acronym));
        }
        return degrees.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }

  getCourses(academicYear: string, degreeId: string): Promise<Course[]> {
    // FIXME: take server out
    return FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/' + degreeId + '/courses?academicTerm=' + academicYear)
      .then(r => r.json())
      .then(json => {
        const courses: Course[] = [];

        for (const j of json) {
          // Optional courses
          if (j.acronym[0] === 'O' && j.acronym[1] >= '0'  && j.acronym[1] <= '9') { continue; }

          let types: Types[] = [];
          FenixService.httpGet('https://cors-anywhere.herokuapp.com/https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/' + j.id + '/schedule')
            .then(r => r.json())
            .then(json2 => {

              for (const cl of json2.courseLoads) {
                let type;
                switch (cl.type){
                  case 'TEORICA':
                    type = Types.TEORICA;
                    break;

                  case 'LABORATORIAL':
                    type = Types.LABORATORIAL;
                    break;

                  case 'PROBLEMAS':
                    type = Types.PROBLEMAS;
                    break;

                  case 'SEMINARY':
                    type = Types.SEMINARY;
                    break;

                  case 'TUTORIAL_ORIENTATION':
                    type = Types.TUTORIAL_ORIENTATION;
                    break;

                  case 'TRAINING_PERIOD':
                    type = Types.TRAINING_PERIOD;
                    break;

                  default:
                    type = cl.type.toLowerCase();
                    type = type[0].toUpperCase() + type.substr(1);
                }
                types.push(type);
              }
              types = types.reverse();

            });
          courses.push(new Course(j.id, j.name, j.acronym, types));
        }

        return courses.sort((a, b) => a.acronym.localeCompare(b.acronym));
      });
  }
}
