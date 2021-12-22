/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-unsafe-member-access */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import JWT from 'jsonwebtoken';

import { FcmHelper } from '../../src/services/fcmHelper';
import { cleanup, setup } from './multipleToken.spec.data/setup.helper';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { MessageQueueClient } from '@pia/lib-messagequeue';
import { EventEmitter, once } from 'events';
import { MessageQueueService } from '../../src/services/messageQueueService';
import { HttpClient } from '@pia-system/lib-http-clients-internal';

interface FcmToken {
  fcm_token: string;
}

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/notification';

const fetchMock = fetchMocker.sandbox();
const suiteSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudie'],
};

const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudie'],
};

const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const probandHeader1 = { authorization: probandToken1 };
const pmHeader = { authorization: pmToken };

const FcmHelperMock = {
  sendDefaultNotification: sinon.stub().resolves({
    error: undefined,
    exception: undefined,
  }),
};

describe('message queue service', () => {
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  const endOfMessageHandlingEmitter: EventEmitter = new EventEmitter();
  const endOfProbandDeleted = 'endOfProbandDeleted';

  beforeEach(() => {
    const stub = testSandbox.stub(MessageQueueService, 'onProbandDeleted');
    stub.callsFake(async (pseudonym) => {
      await stub.wrappedMethod(pseudonym).finally(() => {
        endOfMessageHandlingEmitter.emit(endOfProbandDeleted);
      });
    });
  });

  before(async () => {
    suiteSandbox
      .stub(FcmHelper, 'sendDefaultNotification')
      .callsFake(FcmHelperMock.sendDefaultNotification);
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    await Server.init();
    await mqc.connect(true);
  });

  after(async () => {
    await mqc.disconnect();
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async () => {
    await setup();
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
  });

  afterEach(async () => {
    await cleanup();
    testSandbox.restore();
    fetchMock.restore();

    FcmHelperMock.sendDefaultNotification.resetHistory();
  });

  it('onProbandDeleted should delete the user token', async () => {
    fetchMock.get('express:/user/users/QTestProband1', StatusCodes.NOT_FOUND);

    const producer = await mqc.createProducer('proband.deleted');

    const resultPostToken1 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token1',
      });
    expect(resultPostToken1).to.have.status(StatusCodes.OK);
    expect((resultPostToken1.body as FcmToken).fcm_token).to.equal('token1');

    const validNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1'],
    };

    const resultPostNotification1 = await chai
      .request(apiAddress)
      .post('/notification')
      .set(pmHeader)
      .send(validNotification);
    expect(resultPostNotification1).to.have.status(200);
    expect(resultPostNotification1.body).to.eql({ success: true });

    expect(FcmHelperMock.sendDefaultNotification.callCount).to.equal(1);

    FcmHelperMock.sendDefaultNotification.resetHistory();

    await producer.publish({
      pseudonym: 'QTestProband1',
    });
    await once(endOfMessageHandlingEmitter, endOfProbandDeleted);

    const resultPostNotification2 = await chai
      .request(apiAddress)
      .post('/notification')
      .set(pmHeader)
      .send(validNotification);
    expect(resultPostNotification2).to.have.status(200);
    expect(resultPostNotification2.body).to.eql({ success: false });

    expect(FcmHelperMock.sendDefaultNotification.callCount).to.equal(0);
  });
});
