/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import fbAdmin from 'firebase-admin';
import { HttpsProxyAgent } from 'https-proxy-agent';
import sinon, { createSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import { config } from '../config';
import {
  FirebaseMessageRejectedError,
  FirebaseMessageUnknownError,
} from '../errors';
import { FcmHelper } from './fcmHelper';

chai.use(sinonChai);
const sandbox = createSandbox();

describe('FcmHelper', () => {
  const expectedUniqueFcmMessageId = 'expectedUniqueFcmMessageId';
  let sendStub: SinonStub;
  let messagingStub: Partial<fbAdmin.messaging.Messaging>;
  let fbAdminInitAppStub: SinonStub;
  let credentialStub: SinonStub;
  const certReturn: fbAdmin.credential.Credential = {
    getAccessToken: sandbox.stub(),
  };

  beforeEach(() => {
    // Stub the messaging method
    sendStub = sandbox.stub().resolves(expectedUniqueFcmMessageId);
    messagingStub = {
      send: sendStub,
    };
    sandbox
      .stub(FcmHelper, 'getFirebaseMessaging')
      .returns(messagingStub as fbAdmin.messaging.Messaging);
    fbAdminInitAppStub = sandbox.stub(fbAdmin, 'initializeApp');
    credentialStub = sandbox
      .stub(fbAdmin.credential, 'cert')
      .returns(certReturn);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initFBAdmin', () => {
    let consoleLogStub: SinonStub;
    let configProxyUrlStub: SinonStub;

    beforeEach(() => {
      consoleLogStub = sandbox.stub(console, 'log');
      configProxyUrlStub = sandbox.stub(config, 'proxyUrl');
    });

    it('should initialize firebase app without proxy when proxyUrl is not configured', () => {
      // Arrange
      configProxyUrlStub.value(undefined);
      const credential = config.fireBaseCredentials;

      // Act
      FcmHelper.initFBAdmin();

      // Assert
      expect(consoleLogStub).to.have.been.calledWith('Using no https proxy');
      expect(fbAdminInitAppStub).to.have.been.calledOnceWithExactly({
        credential: certReturn,
        projectId: credential.projectId,
        httpAgent: undefined,
      });
      expect(credentialStub).to.have.been.calledWith(credential, undefined);
    });

    it('should initialize firebase app with proxy when proxyUrl is configured', () => {
      // Arrange
      const expectedProxyUrl = 'http://proxy.example.com:8080';
      configProxyUrlStub.value(expectedProxyUrl);
      const credential = config.fireBaseCredentials;

      // Act
      FcmHelper.initFBAdmin();

      // Assert
      expect(consoleLogStub).to.have.been.calledWith(
        'Using https proxy ' + expectedProxyUrl
      );
      expect(fbAdminInitAppStub).to.have.been.calledOnceWithExactly({
        credential: certReturn,
        projectId: credential.projectId,
        httpAgent: sandbox.match.instanceOf(HttpsProxyAgent),
      });
      expect(credentialStub).to.have.been.calledWith(
        credential,
        sinon.match.instanceOf(HttpsProxyAgent)
      );
    });

    it('should create HttpsProxyAgent with correct proxy URL', () => {
      // Arrange
      const expectedProxyUrl = 'https://secure-proxy.example.com:8443';
      configProxyUrlStub.value(expectedProxyUrl);

      // Act
      FcmHelper.initFBAdmin();

      // Assert
      const callArgs = credentialStub.getCall(0).args;
      const proxyAgent = callArgs[1] as HttpsProxyAgent<string>;
      expect(proxyAgent).to.be.instanceOf(HttpsProxyAgent);
      expect(proxyAgent.proxy.href).to.equal(expectedProxyUrl + '/');
    });
  });

  describe('sendDefaultNotification', () => {
    beforeEach(() => {
      // Initialize Firebase app for these tests
      FcmHelper.initFBAdmin();
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
      sendStub.rejects(expectedError.originalError);

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
      sendStub.rejects(expectedError.originalError);

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
  });

  function getFirebaseMessagingError(code: string): fbAdmin.FirebaseError {
    return {
      code,
      message: 'expected message',
    } as unknown as fbAdmin.FirebaseError;
  }
});
