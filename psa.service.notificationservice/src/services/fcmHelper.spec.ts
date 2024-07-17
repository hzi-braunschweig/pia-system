/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import fbAdmin from 'firebase-admin';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { config } from '../config';
import { FcmHelper } from './fcmHelper';
import {
  FirebaseMessageRejectedError,
  FirebaseMessageUnknownError,
} from '../errors';

chai.use(sinonChai);

describe('FcmHelper', () => {
  const expectedUniqueFcmMessageId = 'expectedUniqueFcmMessageId';
  const sendStub = sinon.stub().resolves(expectedUniqueFcmMessageId);
  sinon.stub(FcmHelper, 'getFirebaseMessaging').returns({
    send: sendStub,
  } as unknown as fbAdmin.messaging.Messaging);

  afterEach(() => {
    sendStub.resetHistory();
  });

  it('should initialize firebase app', () => {
    const fbAdminMockInit = sinon.stub(fbAdmin, 'initializeApp');
    const credential = config.fireBaseCredentials;
    sinon.stub(fbAdmin.credential);

    FcmHelper.initFBAdmin();

    expect(fbAdminMockInit).to.have.been.calledOnceWithExactly({
      credential: sinon.match.any,
      projectId: credential.projectId,
    });
  });

  it('should send the default notification', async () => {
    // Arrange
    const expectedTitle = 'PIA - Sie haben eine neue Nachricht.';
    const expectedBody =
      'Bitte tippen Sie auf diese Meldung, um Sie anzuzeigen.';
    const expectedToken = 'expectedToken';
    const expectedNotificationId = 1;
    const expectedBadgeNumber = 1;
    const expectedMessage: fbAdmin.messaging.TokenMessage = {
      notification: {
        title: expectedTitle,
        body: expectedBody,
      },
      data: {
        id: expectedNotificationId.toString(),
        title: expectedTitle,
        body: expectedBody,
        notification_foreground: 'true',
      },
      token: expectedToken,
      apns: {
        payload: {
          aps: {
            badge: expectedBadgeNumber,
          },
        },
      },
      android: {
        notification: {
          notificationCount: expectedBadgeNumber,
        },
      },
    };

    // Act
    const result = await FcmHelper.sendDefaultNotification(
      expectedToken,
      expectedNotificationId,
      expectedBadgeNumber
    );

    // Assert
    expect(result).to.deep.equal(expectedUniqueFcmMessageId);

    expect(sendStub).to.have.been.calledOnceWithExactly(expectedMessage);
  });

  it('should send the default notification without badge number', async () => {
    // Arrange
    const expectedTitle = 'PIA - Sie haben eine neue Nachricht.';
    const expectedBody =
      'Bitte tippen Sie auf diese Meldung, um Sie anzuzeigen.';
    const expectedToken = 'expectedToken';
    const expectedNotificationId = 1;
    const expectedMessage: fbAdmin.messaging.TokenMessage = {
      notification: {
        title: expectedTitle,
        body: expectedBody,
      },
      data: {
        id: expectedNotificationId.toString(),
        title: expectedTitle,
        body: expectedBody,
        notification_foreground: 'true',
      },
      token: expectedToken,
    };

    // Act
    const result = await FcmHelper.sendDefaultNotification(
      expectedToken,
      expectedNotificationId
    );

    // Assert
    expect(result).to.deep.equal(expectedUniqueFcmMessageId);
    expect(sendStub).to.have.been.calledOnceWithExactly(expectedMessage);
  });

  it('should return an error when message was rejected due to registration token not being registered', (done) => {
    const expectedError = new FirebaseMessageRejectedError(
      getFirebaseMessagingError('messaging/registration-token-not-registered')
    );
    sendStub.rejects(expectedError);

    FcmHelper.sendDefaultNotification('anyToken', 1)
      .then(() => expect.fail('error expected'))
      .catch((error) => {
        expect(error).to.deep.equal(expectedError);
      })
      .finally(() => done());
  });

  it('should return an error when sending failed for any firebase related reason', (done) => {
    const expectedError = new FirebaseMessageUnknownError(
      getFirebaseMessagingError('app/no-app')
    );
    sendStub.rejects(expectedError);

    FcmHelper.sendDefaultNotification('anyToken', 1)
      .then(() => expect.fail('error expected'))
      .catch((error) => {
        expect(error).to.deep.equal(expectedError);
      })
      .finally(() => done());
  });

  it('should throw the exact same error again, when error is not firebase related', async () => {
    const expectedError = new Error('Some error');
    sendStub.rejects(expectedError);

    try {
      await FcmHelper.sendDefaultNotification('anyToken', 1);
      expect.fail('should have thrown an error');
    } catch (error) {
      expect(error).to.deep.equal(expectedError);
    }
  });

  function getFirebaseMessagingError(code: string): fbAdmin.FirebaseError {
    return {
      code,
      message: 'expected message',
    } as unknown as fbAdmin.FirebaseError;
  }
});
