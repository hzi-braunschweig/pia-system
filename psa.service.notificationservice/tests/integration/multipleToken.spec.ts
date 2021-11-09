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
import * as fetch from 'node-fetch';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import JWT from 'jsonwebtoken';

import { FcmHelper } from '../../src/services/fcmHelper';
import { cleanup, setup } from './multipleToken.spec.data/setup.helper';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';
import { config } from '../../src/config';

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
  groups: ['ApiTestStudie'],
};

const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['ApiTestStudie'],
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

describe('/multipleToken', () => {
  before(async () => {
    suiteSandbox
      .stub(FcmHelper, 'sendDefaultNotification')
      .callsFake(FcmHelperMock.sendDefaultNotification);
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async () => {
    await setup();
    testSandbox
      .stub<typeof fetch, 'default'>(fetch, 'default')
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

  it('should be able to send notifications to multiple devices', async () => {
    const resultPostToken1 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token1',
      });
    expect(resultPostToken1).to.have.status(StatusCodes.OK);
    expect((resultPostToken1.body as FcmToken).fcm_token).to.equal('token1');

    const resultPostToken2 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token2',
      });
    expect(resultPostToken2).to.have.status(StatusCodes.OK);
    expect((resultPostToken2.body as FcmToken).fcm_token).to.equal('token2');

    const validNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1'],
    };

    const resultPostNotification = await chai
      .request(apiAddress)
      .post('/notification')
      .set(pmHeader)
      .send(validNotification);
    expect(resultPostNotification).to.have.status(200);
    expect(resultPostNotification.body).to.eql({ success: true });

    expect(FcmHelperMock.sendDefaultNotification.callCount).to.equal(2);
  });

  it('should be able to send notifications to multiple devices twice', async () => {
    const resultPostToken1 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token1',
      });
    expect(resultPostToken1).to.have.status(StatusCodes.OK);
    expect((resultPostToken1.body as FcmToken).fcm_token).to.equal('token1');

    const resultPostToken2 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token2',
      });
    expect(resultPostToken2).to.have.status(StatusCodes.OK);
    expect((resultPostToken2.body as FcmToken).fcm_token).to.equal('token2');

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

    expect(FcmHelperMock.sendDefaultNotification.callCount).to.equal(2);

    const resultPostNotification2 = await chai
      .request(apiAddress)
      .post('/notification')
      .set(pmHeader)
      .send(validNotification);
    expect(resultPostNotification2).to.have.status(200);
    expect(resultPostNotification2.body).to.eql({ success: true });

    expect(FcmHelperMock.sendDefaultNotification.callCount).to.equal(4);
  });

  it('should be able to add the same token twice but only recieve one notification', async () => {
    const resultPostToken1 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token',
      });
    expect(resultPostToken1).to.have.status(StatusCodes.OK);
    expect((resultPostToken1.body as FcmToken).fcm_token).to.equal('token');

    const resultPostToken2 = await chai
      .request(apiAddress)
      .post('/fcmToken')
      .set(probandHeader1)
      .send({
        fcm_token: 'token',
      });
    expect(resultPostToken2).to.have.status(StatusCodes.OK);
    expect((resultPostToken2.body as FcmToken).fcm_token).to.equal('token');

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
  });
});
