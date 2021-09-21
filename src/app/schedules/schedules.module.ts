import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SchedulesRoutingModule } from './schedules-routing.module';
import { SchedulesComponent } from './schedules.component';
import { TimetableComponent } from './timetable/timetable.component';
import { TranslateModule } from '@ngx-translate/core';
import { ScheduleCardComponent } from './schedule-card/schedule-card.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { PillComponent } from './pill/pill.component';
import {FormsModule} from '@angular/forms';
import {ClickedOutsideDirective} from '../_directives/clicked-outside.directive';


@NgModule({
  declarations: [SchedulesComponent, TimetableComponent, ScheduleCardComponent, PillComponent, ClickedOutsideDirective],
  exports: [
    TimetableComponent,
    SchedulesComponent
  ],
  imports: [
    CommonModule,
    SchedulesRoutingModule,
    TranslateModule,
    FontAwesomeModule,
    FormsModule
  ]
})
export class SchedulesModule { }
