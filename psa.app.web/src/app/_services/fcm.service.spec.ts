/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { FCMService } from './fcm.service';
import { User } from '../psa.app.core/models/user';
import firebase from 'firebase/compat';
import { AppModule } from '../app.module';
import { AuthenticationManager } from './authentication-manager.service';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { createUser } from '../psa.app.core/models/instance.helper.spec';
import { DOCUMENT } from '@angular/common';
import { NotificationService } from '../psa.app.core/providers/notification-service/notification-service';
import { Router } from '@angular/router';
import Spy = jasmine.Spy;
import MessagePayload = firebase.messaging.MessagePayload;
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('FcmService', () => {
  let currentUserObservableMock: BehaviorSubject<User>;
  let auth: SpyObj<AuthenticationManager>;

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
          messages: messageSubject,
          requestToken: new BehaviorSubject('sometoken'),
          getToken: getTokenSubject,
        }
      ));
    currentUserObservableMock = new BehaviorSubject<User>(null);
    auth = createSpyObj<AuthenticationManager>(
      'AuthenticationManager',
      ['getCurrentRole'],
      {
        currentUser$: currentUserObservableMock,
      }
    );
    notificationService = createSpyObj<NotificationService>(
      'NotificationService',
      ['postFCMToken']
    );
    router = createSpyObj<Router>('Router', ['navigate']);

    // Build Base Module
    await MockBuilder(FCMService, AppModule)
      .mock(AuthenticationManager, auth)
      .mock(AngularFireMessaging, afMessagingMock)
      .mock(NotificationService, notificationService)
      .mock(Router, router);
  });

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
    return TestBed.inject(FCMService);
  });

  it('should post the fcm token for probands', fakeAsync(() => {
    currentUserObservableMock.next(createUser({ role: 'Proband' }));
    tick();
    expect(notificationService.postFCMToken).toHaveBeenCalledOnceWith(
      'sometoken'
    );
  }));

  it('should NOT post the fcm token for forscher', fakeAsync(() => {
    currentUserObservableMock.next(createUser({ role: 'Forscher' }));
    tick();
    expect(notificationService.postFCMToken).not.toHaveBeenCalled();
  }));

  it('should create a notification', fakeAsync(() => {
    currentUserObservableMock.next(createUser({ role: 'Proband' }));
    tick();
    messageSubject.next(createMessage());
    tick();
    expect(notificationConstructor).toHaveBeenCalled();
  }));

  it('should navigate to home on click', fakeAsync(() => {
    const onclickSetter = Object.getOwnPropertyDescriptor(
      notificationMock,
      'onclick'
    ).set as Spy;

    currentUserObservableMock.next(createUser());
    tick();
    messageSubject.next(createMessage());
    tick();
    expect(onclickSetter).toHaveBeenCalled();
    const onClick = onclickSetter.calls.mostRecent().args[0];
    onClick();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/home'], {
      queryParams: { notification_id: '1234' },
    });
  }));

  it('should invalidate the fcm token if no user is logged in', fakeAsync(() => {
    afMessagingMock.deleteToken.calls.reset();
    getTokenSubject.next('currentToken');
    currentUserObservableMock.next(createUser());
    tick();
    currentUserObservableMock.next(null);
    tick();
    expect(afMessagingMock.deleteToken).toHaveBeenCalledOnceWith(
      'currentToken'
    );
  }));

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
