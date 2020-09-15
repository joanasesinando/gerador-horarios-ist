import {Component} from '@angular/core';

import { faBolt, faCheck, faExclamation, faQuestion } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'gerador-horarios-ist';

  faBolt = faBolt;
  faCheck = faCheck;
  faExclamation = faExclamation;
  faQuestion = faQuestion
}
