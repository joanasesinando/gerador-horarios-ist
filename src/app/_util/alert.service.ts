import { Injectable } from '@angular/core';

declare let $;

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  public showAlert(title: string, message: string, type: string): void {
    $('#' + type + 'Alert' + ' .alert-title').text(title);
    $('#' + type + 'Alert' + ' .alert-text').text(message);
    const alert = $('#' + type + 'Alert');
    alert.show();
    window.setTimeout(() => alert.hide(), 8000);
  }

}
