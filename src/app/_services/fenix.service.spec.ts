import { TestBed } from '@angular/core/testing';

import {FenixService} from './fenix.service';
import {TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';


describe('FenixService', () => {
  let service: FenixService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        })
      ],
      providers: [TranslateService]
    });
    service = TestBed.inject(FenixService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get degrees successfully', () => {
    // TODO
  });
});
