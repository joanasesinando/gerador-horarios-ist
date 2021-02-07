import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {of} from 'rxjs';

import {TimetableComponent} from './timetable.component';

import {TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {SchedulesGenerationService} from '../../_services/schedules-generation/schedules-generation.service';
import {LoggerService} from '../../_util/logger.service';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

import {Shift} from '../../_domain/Shift/Shift';
import {ClassType} from '../../_domain/ClassType/ClassType';
import {Lesson} from '../../_domain/Lesson/Lesson';
import {Course} from '../../_domain/Course/Course';
import {StateService} from '../../_services/state/state.service';

describe('TimetableComponent', () => {
  let component: TimetableComponent;
  let fixture: ComponentFixture<TimetableComponent>;
  let de: DebugElement;

  const TYPES_OF_CLASSES: ClassType[] = [ClassType.THEORY_PT, ClassType.LAB_PT];
  const CAMPUS: string[] = ['Alameda'];
  const ROOM = 'Room';

  const COURSES: Course[] = [
    new Course(1, 'C1', 'C01', 1, TYPES_OF_CLASSES, CAMPUS,
      [
        new Shift('C1T01', TYPES_OF_CLASSES[0], [
          new Lesson(new Date('2020-10-05 08:00'), new Date('2020-10-05 09:30'), ROOM, CAMPUS[0]),
          new Lesson(new Date('2020-10-07 08:00'), new Date('2020-10-07 09:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C1T02', TYPES_OF_CLASSES[0], [
          new Lesson(new Date('2020-10-05 09:30'), new Date('2020-10-05 11:00'), ROOM, CAMPUS[0]),
          new Lesson(new Date('2020-10-07 09:30'), new Date('2020-10-07 11:00'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C1L01', TYPES_OF_CLASSES[1], [
          new Lesson(new Date('2020-10-06 08:00'), new Date('2020-10-06 09:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C1L02', TYPES_OF_CLASSES[1], [
          new Lesson(new Date('2020-10-06 09:30'), new Date('2020-10-06 11:00'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
      ]),
    new Course(2, 'C2', 'C02', 1, TYPES_OF_CLASSES, CAMPUS,
      [
        new Shift('C2T01', TYPES_OF_CLASSES[0], [
          new Lesson(new Date('2020-10-06 12:00'), new Date('2020-10-06 13:30'), ROOM, CAMPUS[0]),
          new Lesson(new Date('2020-10-08 12:00'), new Date('2020-10-08 13:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C2T02', TYPES_OF_CLASSES[0], [
          new Lesson(new Date('2020-10-06 13:30'), new Date('2020-10-06 15:00'), ROOM, CAMPUS[0]),
          new Lesson(new Date('2020-10-08 13:30'), new Date('2020-10-08 15:00'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C2L01', TYPES_OF_CLASSES[1], [
          new Lesson(new Date('2020-10-07 12:00'), new Date('2020-10-06 13:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C2L02', TYPES_OF_CLASSES[1], [
          new Lesson(new Date('2020-10-07 13:30'), new Date('2020-10-06 15:00'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
      ]),
    new Course(3, 'C3', 'C03', 1, TYPES_OF_CLASSES, CAMPUS,
      [
        new Shift('C3T01', TYPES_OF_CLASSES[0], [
          new Lesson(new Date('2020-10-05 12:00'), new Date('2020-10-05 13:30'), ROOM, CAMPUS[0]),
          new Lesson(new Date('2020-10-09 12:00'), new Date('2020-10-09 13:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C3T02', TYPES_OF_CLASSES[0], [
          new Lesson(new Date('2020-10-05 13:30'), new Date('2020-10-05 15:00'), ROOM, CAMPUS[0]),
          new Lesson(new Date('2020-10-09 13:30'), new Date('2020-10-09 15:00'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C3L01', TYPES_OF_CLASSES[1], [
          new Lesson(new Date('2020-10-05 15:00'), new Date('2020-10-06 16:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
        new Shift('C3L02', TYPES_OF_CLASSES[1], [
          new Lesson(new Date('2020-10-09 15:00'), new Date('2020-10-06 16:30'), ROOM, CAMPUS[0])
        ], CAMPUS[0]),
      ]),
  ];

  const logger: LoggerService = new LoggerService();
  const stateService: StateService = new StateService();
  const scheduleGenerationService: SchedulesGenerationService = new SchedulesGenerationService(logger, stateService);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        }),
        FontAwesomeModule
      ],
      declarations: [ TimetableComponent ],
      providers: [
        TranslateService
      ]
    })
    .compileComponents(); // compiles template and css
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimetableComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;

    // Generate schedules
    component.schedules = scheduleGenerationService.generateSchedules(COURSES);
    component.schedulesToShow = component.schedules;

    component.keydownEvents = of('keydown');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have schedules', () => {
    expect(component.schedules.length > 0);
  });

  describe('Pinning shifts', () => {
    it('should call togglePin()', () => {
      spyOn(component, 'togglePin');

      const shiftName = 'C1T01';
      const shiftToPin = de.nativeElement.querySelector('[data-shift="' + shiftName + '"]');
      // shiftToPin.click();

      // expect(component.togglePin).toHaveBeenCalled();
      // expect(shiftToPin).toHaveClass('pinned');
    });
  });
});
