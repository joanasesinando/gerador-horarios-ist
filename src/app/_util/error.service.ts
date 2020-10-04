import { Injectable } from '@angular/core';
import {AlertService} from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alertService: AlertService) { }

  public showError(error: string): void {
    console.error(error);
    this.alertService.showAlert('Error', error, 'danger');
    setTimeout(() => {
      this.alertService.showAlert(
        '📢 Ajuda-nos a melhorar',
        'Reporta este erro através do formulário de feedback para que possamos corrigi-lo.',
        'info');
    }, 2000);
  }
}
