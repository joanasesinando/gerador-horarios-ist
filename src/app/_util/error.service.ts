import { Injectable } from '@angular/core';
import {AlertService} from './alert.service';
import {TranslateService} from '@ngx-translate/core';
import {environment} from '../../environments/environment.prod';
import * as $ from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alertService: AlertService, private translateService: TranslateService) { }

  public showError(error: string, context?): void {
    console.error(error);
    this.alertService.showAlert('⚡ Error', error, 'danger');
    setTimeout(() => {
      this.translateService.currentLang === 'pt-PT' ?
        this.alertService.showAlert(
          '📢 Ajuda-nos a melhorar',
          'Reporta este erro através do formulário de feedback para que possamos corrigi-lo.',
          'info') :
        this.alertService.showAlert(
          '📢 Help us improve',
          'Report this error through our feedback form so we can fix it.',
          'info');
    }, 2000);

    // Notify through e-mail
    $.ajax({
      type: 'POST',
      url: environment.googleScript,
      crossDomain: true,
      data: Object.assign({Error: error}, context),
      cache: false
    });
  }
}
