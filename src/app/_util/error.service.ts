import { Injectable } from '@angular/core';
import {AlertService} from './alert.service';

declare let $;

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private alertService: AlertService) { }

  public showError(error: string): void {
    console.error(error);
    this.alertService.showAlert('Error', error, 'danger');
  }
}
