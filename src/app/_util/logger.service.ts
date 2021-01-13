import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  public log(title: string, obj?: any): void {
    console.log('%c' + title.toUpperCase(), 'color: #448AFF; font-weight: bold');
    if (obj) console.log(obj);
    console.log('\n');
  }
}
