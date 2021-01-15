import { Injectable } from '@angular/core';
import {AlertService} from './alert.service';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alertService: AlertService, private translateService: TranslateService) { }

  public showError(error: string): void {
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
  }
}
