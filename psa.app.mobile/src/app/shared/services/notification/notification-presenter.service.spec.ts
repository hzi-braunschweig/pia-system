import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

import { NotificationPresenterService } from './notification-presenter.service';
import { NotificationClientService } from './notification-client.service';

describe('NotificationPresenterService', () => {
  let service: NotificationPresenterService;

  let notificationClient: SpyObj<NotificationClientService>;
  let alertCtrl: SpyObj<AlertController>;
  let translate: SpyObj<TranslateService>;
  let router: SpyObj<Router>;

  beforeEach(() => {
    notificationClient = jasmine.createSpyObj('NotificationClientService', [
      'getNotificationById',
    ]);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationClientService, useValue: notificationClient },
        { provide: AlertController, useValue: alertCtrl },
        { provide: TranslateService, useValue: translate },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(NotificationPresenterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
