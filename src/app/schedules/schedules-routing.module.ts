import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {SchedulesComponent} from './schedules.component';

const routes: Routes = [
  {
    path: '',
    component: SchedulesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SchedulesRoutingModule { }
