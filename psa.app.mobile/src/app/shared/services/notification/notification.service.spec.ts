/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import SpyObj = jasmine.SpyObj;

import { NotificationService } from './notification.service';
import { NotificationPresenterService } from './notification-presenter.service';
import { NotificationClientService } from './notification-client.service';
import { AuthService } from '../../../auth/auth.service';
import { PushNotifications } from '@capacitor/push-notifications';

describe('NotificationService', () => {
  let service: NotificationService;

  let notificationPresenter: SpyObj<NotificationPresenterService>;
  let notificationClient: SpyObj<NotificationClientService>;
  let platform: SpyObj<Platform>;
  let router: SpyObj<Router>;
  let auth: SpyObj<AuthService>;

  let registrationCallback: any;
  let pushNotificationActionPerformedCallback: any;
  let removeListenerSpy: jasmine.Spy;

  beforeEach(() => {
    notificationPresenter = jasmine.createSpyObj(
      'NotificationPresenterService',
      ['present']
    );
    notificationPresenter.present.and.resolveTo();
    notificationClient = jasmine.createSpyObj('NotificationClientService', [
      'postFCMToken',
    ]);
    removeListenerSpy = jasmine.createSpy('remove');

    spyOn(PushNotifications, 'checkPermissions').and.callThrough();
    spyOn(PushNotifications, 'requestPermissions').and.callThrough();
    spyOn(PushNotifications, 'register').and.callThrough();
    spyOn(PushNotifications, 'unregister').and.callThrough();
    spyOn(PushNotifications, 'removeAllListeners').and.callThrough();
    spyOn(
      PushNotifications,
      'removeAllDeliveredNotifications'
    ).and.callThrough();

    spyOn(PushNotifications, 'addListener').and.callFake(
      (
        eventName:
          | 'registration'
          | 'registrationError'
          | 'pushNotificationReceived'
          | 'pushNotificationActionPerformed',
        listenerFunc: (token: any) => void
      ) => {
        switch (eventName) {
          case 'registration':
            listenerFunc({ value: 'test.token' });
            registrationCallback = listenerFunc;
            break;

          case 'pushNotificationActionPerformed':
            pushNotificationActionPerformedCallback = listenerFunc;
            break;
        }

        return Promise.resolve({
          remove: removeListenerSpy,
        });
      }
    );

    platform = jasmine.createSpyObj('Platform', ['is']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    auth.isAuthenticated.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationPresenterService,
          useValue: notificationPresenter,
        },
        { provide: NotificationClientService, useValue: notificationClient },
        { provide: Platform, useValue: platform },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  describe('initPushNotifications', () => {
    it('should ask for permission if not already granted', async () => {
      (PushNotifications.checkPermissions as jasmine.Spy).and.resolveTo({
        receive: 'prompt',
      });

      await service.initPushNotifications('test-1234');

      expect(PushNotifications.requestPermissions).toHaveBeenCalled();
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

      registrationCallback({ value: 'new.token' });
      tick();

      expect(notificationClient.postFCMToken).toHaveBeenCalledWith('new.token');
    }));

    it('should open newly received messages', fakeAsync(() => {
      service.initPushNotifications('test-1234');
      tick();

      pushNotificationActionPerformedCallback({
        notification: { data: { id: 'test-id' } },
      });
      tick();

      expect(notificationPresenter.present).toHaveBeenCalledOnceWith('test-id');
    }));

    it('should unregister if user is logged out', fakeAsync(() => {
      service.initPushNotifications('test-1234');
      service.onLogout();

      tick();

      expect(PushNotifications.unregister).toHaveBeenCalled();
      expect(
        PushNotifications.removeAllDeliveredNotifications
      ).toHaveBeenCalled();
      expect(PushNotifications.removeAllListeners).toHaveBeenCalled();
    }));

    it('should present undelivered messages', fakeAsync(() => {
      auth.isAuthenticated.and.returnValue(false);
      service.initPushNotifications('test-1234');
      tick();
      pushNotificationActionPerformedCallback({
        notification: { data: { id: 'test-id2' } },
      });
      tick();

      expect(notificationPresenter.present).not.toHaveBeenCalled();

      service.initPushNotifications('test-1234');
      tick();

      expect(notificationPresenter.present).toHaveBeenCalledOnceWith(
        'test-id2'
      );
    }));
  });
});
