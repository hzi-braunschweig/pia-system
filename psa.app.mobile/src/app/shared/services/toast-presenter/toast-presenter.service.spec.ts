import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

import { ToastPresenterService } from './toast-presenter.service';

describe('ToastPresenterService', () => {
  let service: ToastPresenterService;

  let translate: SpyObj<TranslateService>;

  beforeEach(() => {
    translate = jasmine.createSpyObj('TranslateService', ['presentToast']);
    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: translate }],
    });
    service = TestBed.inject(ToastPresenterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
