import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SchedulesRoutingModule } from './schedules-routing.module';
import { SchedulesComponent } from './schedules.component';
import { TimetableComponent } from './timetable/timetable.component';
import { TranslateModule } from '@ngx-translate/core';
import { ScheduleCardComponent } from './schedule-card/schedule-card.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [SchedulesComponent, TimetableComponent, ScheduleCardComponent],
  exports: [
    TimetableComponent,
    SchedulesComponent
  ],
    imports: [
        CommonModule,
        SchedulesRoutingModule,
        TranslateModule,
        FontAwesomeModule
    ]
})
export class SchedulesModule { }
