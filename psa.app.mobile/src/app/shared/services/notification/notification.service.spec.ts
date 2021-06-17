import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Platform } from '@ionic/angular';
import SpyObj = jasmine.SpyObj;

import { NotificationService } from './notification.service';
import { NotificationPresenterService } from './notification-presenter.service';
import { NotificationClientService } from './notification-client.service';
import { AuthService } from '../../../auth/auth.service';

describe('NotificationService', () => {
  let service: NotificationService;

  let notificationPresenter: SpyObj<NotificationPresenterService>;
  let notificationClient: SpyObj<NotificationClientService>;
  let fcm: SpyObj<FirebaseX>;
  let platform: SpyObj<Platform>;
  let router: SpyObj<Router>;
  let auth: SpyObj<AuthService>;

  beforeEach(() => {
    notificationPresenter = jasmine.createSpyObj(
      'NotificationPresenterService',
      ['present']
    );
    notificationClient = jasmine.createSpyObj('NotificationClientService', [
      'postFCMToken',
    ]);
    fcm = jasmine.createSpyObj('FCM', [
      'getToken',
      'onTokenRefresh',
      'onNotification',
    ]);
    platform = jasmine.createSpyObj('Platform', ['is']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NotificationPresenterService,
          useValue: notificationPresenter,
        },
        { provide: NotificationClientService, useValue: notificationClient },
        { provide: FirebaseX, useValue: fcm },
        { provide: Platform, useValue: platform },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
