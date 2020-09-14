import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { HomepageRoutingModule } from './homepage-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { HomepageComponent } from './homepage.component';
import { CourseCardComponent } from './course-card/course-card.component';
import { CoursesBannerComponent } from './courses-banner/courses-banner.component';
import { AboutModalComponent } from './about-modal/about-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import {SchedulesModule} from '../schedules/schedules.module';


@NgModule({
  declarations: [
    HomepageComponent,
    CourseCardComponent,
    CoursesBannerComponent,
    AboutModalComponent
  ],
    imports: [
        CommonModule,
        HomepageRoutingModule,
        TranslateModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        SchedulesModule, // FIXME: remove
    ]
})
export class HomepageModule { }
