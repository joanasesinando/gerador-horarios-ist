import { Injectable } from '@angular/core';

import {Subject} from '../subjects-banner/subject';

enum TypeOfClass {
  T = 'Teórica',
  PB = 'Problemas',
  L = 'Laboratório'
}

@Injectable({
  providedIn: 'root'
})
export class SubjectsService {

  getSubjects(academicYear: string, course: string): Subject[] {
    return [
      new Subject('Arquitetura de Software', [TypeOfClass.T, TypeOfClass.PB]),
      new Subject('Bases de Dados', [TypeOfClass.T, TypeOfClass.L]),
      new Subject('Cálculo Diferencial e Integral II', [TypeOfClass.T, TypeOfClass.PB]),
      new Subject('Compiladores', [TypeOfClass.T, TypeOfClass.PB]),
      new Subject('Sistemas Operativos', [TypeOfClass.T, TypeOfClass.L]),
      new Subject('Teoria da Computação', [TypeOfClass.T, TypeOfClass.PB, TypeOfClass.L])
    ].sort((a, b) => a.name.localeCompare(b.name)); // TODO: demo yet
  }
}
