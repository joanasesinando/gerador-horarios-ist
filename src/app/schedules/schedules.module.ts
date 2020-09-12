import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SchedulesRoutingModule } from './schedules-routing.module';
import { SchedulesComponent } from './schedules.component';
import { TimetableComponent } from './timetable/timetable.component';


@NgModule({
  declarations: [SchedulesComponent, TimetableComponent],
  exports: [
    TimetableComponent
  ],
  imports: [
    CommonModule,
    SchedulesRoutingModule
  ]
})
export class SchedulesModule { }
