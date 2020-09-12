import { Injectable } from '@angular/core';

declare let $;

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  public showError(error: string): void {
    console.error(error);
    $('.alert-text').text(error);
    const alert = $('#errorAlert');
    alert.show();
    window.setTimeout(() => alert.hide(), 8000);
  }
}
