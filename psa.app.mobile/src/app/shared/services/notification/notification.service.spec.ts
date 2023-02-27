/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { Platform } from '@ionic/angular';
import SpyObj = jasmine.SpyObj;

import { NotificationService } from './notification.service';
import { NotificationPresenterService } from './notification-presenter.service';
import { NotificationClientService } from './notification-client.service';
import { AuthService } from '../../../auth/auth.service';
import { Subject } from 'rxjs';

describe('NotificationService', () => {
  let service: NotificationService;

  let notificationPresenter: SpyObj<NotificationPresenterService>;
  let notificationClient: SpyObj<NotificationClientService>;
  let fcm: SpyObj<FirebaseX>;
  let platform: SpyObj<Platform>;
  let router: SpyObj<Router>;
  let auth: SpyObj<AuthService>;

  let onTokenRefreshSubject: Subject<string>;
  let onMessageReceivedSubject: Subject<any>;
  let isAuthenticatedSubject: Subject<boolean>;

  beforeEach(() => {
    notificationPresenter = jasmine.createSpyObj(
      'NotificationPresenterService',
      ['present']
    );
    notificationPresenter.present.and.resolveTo();
    notificationClient = jasmine.createSpyObj('NotificationClientService', [
      'postFCMToken',
    ]);

    fcm = jasmine.createSpyObj('FCM', [
      'hasPermission',
      'grantPermission',
      'getToken',
      'onTokenRefresh',
      'onMessageReceived',
      'unregister',
    ]);
    fcm.hasPermission.and.resolveTo(true);
    fcm.grantPermission.and.resolveTo();
    fcm.getToken.and.resolveTo('test.token');
    onTokenRefreshSubject = new Subject<string>();
    fcm.onTokenRefresh.and.returnValue(onTokenRefreshSubject.asObservable());
    onMessageReceivedSubject = new Subject<any>();
    fcm.onMessageReceived.and.returnValue(
      onMessageReceivedSubject.asObservable()
    );

    platform = jasmine.createSpyObj('Platform', ['is']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    isAuthenticatedSubject = new Subject<boolean>();
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated'], {
      isAuthenticated$: isAuthenticatedSubject.asObservable(),
    });
    auth.isAuthenticated.and.resolveTo(true);

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

  describe('initPushNotifications', () => {
    it('should ask for permission if not already granted', async () => {
      fcm.hasPermission.and.resolveTo(false);

      await service.initPushNotifications('test-1234');

      expect(fcm.grantPermission).toHaveBeenCalled();
    });

    it('send the current fcm token to the backend', async () => {
      await service.initPushNotifications('test-1234');

      expect(notificationClient.postFCMToken).toHaveBeenCalledWith(
        'test.token'
      );
    });

    it('should update the fcm token on refresh', fakeAsync(() => {
      service.initPushNotifications('test-1234');
      tick();

      onTokenRefreshSubject.next('new.token');
      tick();

      expect(notificationClient.postFCMToken).toHaveBeenCalledWith('new.token');
    }));

    it('should open newly received messages', fakeAsync(() => {
      service.initPushNotifications('test-1234');
      tick();

      onMessageReceivedSubject.next({
        tap: true,
        id: 'test-id',
      });
      tick();

      expect(notificationPresenter.present).toHaveBeenCalledOnceWith('test-id');
    }));

    it('should unregister if user is logged out', fakeAsync(() => {
      service.initPushNotifications('test-1234');
      tick();

      isAuthenticatedSubject.next(false);
      tick();

      expect(fcm.unregister).toHaveBeenCalled();
    }));

    it('should present undelivered messages', fakeAsync(() => {
      auth.isAuthenticated.and.resolveTo(false);
      service.initPushNotifications('test-1234');
      tick();
      onMessageReceivedSubject.next({
        tap: true,
        id: 'test-id',
      });
      tick();

      expect(notificationPresenter.present).not.toHaveBeenCalled();

      service.initPushNotifications('test-1234');
      tick();

      expect(notificationPresenter.present).toHaveBeenCalledOnceWith('test-id');
    }));
  });
});
