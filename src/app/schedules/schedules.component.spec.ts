import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';

import {SchedulesComponent} from './schedules.component';

import {RouterTestingModule} from '@angular/router/testing';

import {ClassType} from '../_domain/ClassType';


describe('SchedulesComponent', () => {
  let component: SchedulesComponent;
  let fixture: ComponentFixture<SchedulesComponent>;
  let de: DebugElement;

  let data: {selectedCourses: any, academicTerm: string, degreeID: number};

  beforeEach(async(() => {
    data = {
      selectedCourses: [
        {
          _id: 1,
          _name: 'Course #1',
          _acronym: 'C1',
          _types: [ClassType.THEORY_PT, ClassType.LAB_PT],
          _campus: ['Alameda'],
          _shifts: [
            {
              _name: 'T01',
              _types: [ClassType.THEORY_PT],
              _lessons: [
                {
                  _start: 'Mon Sep 07 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                  _end: 'Mon Sep 07 2020 11:00:00 GMT+0100 (Western European Summer Time)',
                  _room: 'R1',
                  _campus: 'Alameda'
                },
                {
                  _start: 'Wed Sep 09 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                  _end: 'Wed Sep 09 2020 11:00:00 GMT+0100 (Western European Summer Time)',
                  _room: 'R1',
                  _campus: 'Alameda'
                }
              ],
              _campus: 'Alameda'
            },
            {
              _name: 'L01',
              _types: [ClassType.LAB_PT],
              _lessons: [
                {
                  _start: 'Tue Sep 08 2020 09:30:00 GMT+0100 (Western European Summer Time)',
                  _end: 'Tue Sep 08 2020 11:00:00 GMT+0100 (Western European Summer Time)',
                  _room: 'R2',
                  _campus: 'Alameda'
                }
              ],
              _campus: 'Alameda'
            }
          ],
          _courseLoads: { TEORICA: 3, LABORATORIAL: 1.5 }
        }
      ],
      academicTerm: '2020/2021',
      degreeID: 1
    };
    window.history.pushState(data, '', '');

    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ],
      declarations: [ SchedulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulesComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have data received', () => {
    expect(data).toBeTruthy();
  });

  it('should return to homepage if no data', () => { // TODO
    // window.history.state.pop();
    // const router = TestBed.createComponent(Router);
  });

});
