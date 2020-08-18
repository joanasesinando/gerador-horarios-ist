import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SubjectCardComponent } from './subject-card/subject-card.component';
import { SubjectsBannerComponent } from './subjects-banner/subjects-banner.component';

@NgModule({
  declarations: [
    AppComponent,
    SubjectCardComponent,
    SubjectsBannerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
