import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HomepageRoutingModule } from './homepage-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';

import { HomepageComponent } from './homepage.component';
import { CourseCardComponent } from './course-card/course-card.component';
import { CoursesBannerComponent } from './courses-banner/courses-banner.component';
import { AboutModalComponent } from './about-modal/about-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { HelpModalComponent } from './help-modal/help-modal.component';


@NgModule({
  declarations: [
    HomepageComponent,
    CourseCardComponent,
    CoursesBannerComponent,
    AboutModalComponent,
    HelpModalComponent
  ],
    imports: [
        CommonModule,
        HomepageRoutingModule,
        TranslateModule,
        FontAwesomeModule,
        FormsModule,
        NgSelectModule
    ]
})
export class HomepageModule { }
