import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CourseCardComponent } from './course-card/course-card.component';
import { CoursesBannerComponent } from './courses-banner/courses-banner.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { AboutModalComponent } from './about-modal/about-modal.component';
import {ReactiveFormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    CourseCardComponent,
    CoursesBannerComponent,
    AboutModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
