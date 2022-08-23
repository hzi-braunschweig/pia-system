/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { DOCUMENT } from '@angular/common';
import { MockBuilder } from 'ng-mocks';
import { BehaviorSubject, NEVER, of, Subject, throwError } from 'rxjs';
import firebase from 'firebase/compat';

import { FCMService } from './fcm.service';
import { AppModule } from '../app.module';
import { NotificationService } from '../psa.app.core/providers/notification-service/notification-service';
import { CurrentUser } from './current-user.service';
import { AuthenticationManager } from './authentication-manager.service';
import Spy = jasmine.Spy;
import MessagePayload = firebase.messaging.MessagePayload;
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('FcmService', () => {
  let service: FCMService;

  let auth: SpyObj<AuthenticationManager>;
  let user: SpyObj<CurrentUser>;
  let messageSubject: Subject<MessagePayload>;
  let getTokenSubject: BehaviorSubject<string>;
  let afMessagingMock: SpyObj<AngularFireMessaging>;

  let notificationService: SpyObj<NotificationService>;
  let router: SpyObj<Router>;

  let notificationMock: SpyObj<Notification>;
  let notificationConstructor: Spy<() => Notification>;

  beforeEach(async () => {
    // Provider and Services
    messageSubject = new Subject();
    (getTokenSubject = new BehaviorSubject('oldToken')),
      (afMessagingMock = createSpyObj<AngularFireMessaging>(
        'AngularFireMessaging',
        ['deleteToken'],
        {
          messages: messageSubject.asObservable(),
          requestToken: of('sometoken'),
          getToken: getTokenSubject.asObservable(),
        }
      ));
    auth = createSpyObj('AuthenticationService', [], {
      onActiveUserLogout$: NEVER,
    });
    user = createSpyObj<CurrentUser>('CurrentUser', ['isProband']);
    user.isProband.and.returnValue(true);
    notificationService = createSpyObj<NotificationService>(
      'NotificationService',
      ['postFCMToken']
    );
    router = createSpyObj<Router>('Router', ['navigate']);

    // Build Base Module
    await MockBuilder(FCMService, AppModule)
      .mock(AuthenticationManager, auth)
      .mock(CurrentUser, user)
      .mock(AngularFireMessaging, afMessagingMock)
      .mock(NotificationService, notificationService)
      .mock(Router, router);
  });

  describe('for Probands', () => {
    beforeEach(() => {
      const document = TestBed.inject(DOCUMENT);
      notificationMock = createSpyObj<Notification>('Notification', undefined, [
        'onclick',
      ]);
      notificationConstructor = spyOn(
        document.defaultView,
        'Notification'
      ).and.returnValue(notificationMock);

      afMessagingMock.deleteToken.and.returnValue(of<boolean>(true));

      // Create component
      service = TestBed.inject(FCMService);
    });

    it('should post the fcm token', fakeAsync(() => {
      expect(notificationService.postFCMToken).toHaveBeenCalledOnceWith(
        'sometoken'
      );
    }));

    it('should create a notification', fakeAsync(() => {
      messageSubject.next(createMessage());
      tick();
      expect(notificationConstructor).toHaveBeenCalled();
    }));

    it('should navigate to home on click', fakeAsync(() => {
      const onclickSetter = Object.getOwnPropertyDescriptor(
        notificationMock,
        'onclick'
      ).set as Spy;

      messageSubject.next(createMessage());
      tick();
      expect(onclickSetter).toHaveBeenCalled();
      const onClick = onclickSetter.calls.mostRecent().args[0];
      onClick();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/home'], {
        queryParams: { notification_id: '1234' },
      });
    }));

    it('should delete the token onLogout()', async () => {
      await service.onLogout();
      expect(afMessagingMock.deleteToken).toHaveBeenCalledOnceWith('oldToken');
    });

    it('should handle errors onLogout()', async () => {
      // Arrange
      afMessagingMock.deleteToken.and.returnValue(throwError('error'));
      const result = await service.onLogout();
      expect(afMessagingMock.deleteToken).toHaveBeenCalled();
    });
  });

  describe('for Professionals', () => {
    beforeEach(() => {
      const document = TestBed.inject(DOCUMENT);
      notificationMock = createSpyObj<Notification>('Notification', undefined, [
        'onclick',
      ]);
      notificationConstructor = spyOn(
        document.defaultView,
        'Notification'
      ).and.returnValue(notificationMock);

      afMessagingMock.deleteToken.and.returnValue(of<boolean>(true));
      user.isProband.and.returnValue(false);

      // Create component
      service = TestBed.inject(FCMService);
    });

    it('should NOT post the fcm token for professionals', fakeAsync(() => {
      expect(notificationService.postFCMToken).not.toHaveBeenCalled();
    }));

    it('should do nothing onLogout()', async () => {
      await service.onLogout();
      expect(afMessagingMock.deleteToken).not.toHaveBeenCalled();
    });
  });

  function createMessage(): MessagePayload {
    return {
      notification: {
        title: 'Important Message',
        body: 'This test runs fine!',
      },
      from: 'me',
      collapseKey: 'collapseKey',
      data: {
        id: '1234',
      },
    };
  }
});
