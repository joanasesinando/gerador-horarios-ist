import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./homepage/homepage.module').then(mod => mod.HomepageModule),
  },
  {
    path: 'generate-schedules',
    loadChildren: () => import('./schedules/schedules.module').then(mod => mod.SchedulesModule),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
