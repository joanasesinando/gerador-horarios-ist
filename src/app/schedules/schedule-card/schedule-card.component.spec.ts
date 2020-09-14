import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleCardComponent } from './schedule-card.component';

describe('ScheduleCardComponent', () => {
  let component: ScheduleCardComponent;
  let fixture: ComponentFixture<ScheduleCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduleCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
