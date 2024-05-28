/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import fbAdmin from 'firebase-admin';
import sinon from 'sinon';

import { FcmHelper } from '../../src/services/fcmHelper';

import { Server } from '../../src/server';

import StatusCodes from 'http-status-codes';

import {
  AuthServerMock,
  AuthTokenMockBuilder,
  ListeningDbClient,
} from '@pia/lib-service-core';
import { config } from '../../src/config';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const suiteSandbox = sinon.createSandbox();

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['QTestStudy'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTestStudy'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['QTestStudy'],
});

interface FcmToken {
  fcm_token: string;
}

describe('/fcmToken', () => {
  beforeEach(() => AuthServerMock.probandRealm().returnValid());
  afterEach(AuthServerMock.cleanAll);

  before(async function () {
    suiteSandbox.stub(ListeningDbClient.prototype);
    suiteSandbox.stub(FcmHelper, 'sendDefaultNotification');
    suiteSandbox.stub(fbAdmin, 'initializeApp');
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  describe('POST fcmToken', function () {
    const payload = {
      fcm_token: 'thisisjustarandomstring',
    };

    const payloadInvalid1 = {
      fcmm_token: 'thisisjustarandomstring',
    };

    const payloadInvalid2 = {
      fcm_token: '',
    };

    const payloadInvalid3 = {
      fcm_token: null,
    };

    it('should return HTTP 401 if the token is invalid', async function () {
      AuthServerMock.cleanAll();
      AuthServerMock.probandRealm().returnInvalid();

      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send(payload);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 401 if the user is not in db', async function () {
      AuthServerMock.cleanAll();
      AuthServerMock.probandRealm().returnError();

      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader2)
        .send(payload);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 400 if the payloads fields are misspelled', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid1 });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 400 if the token is an empty string', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid2 });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 400 if the token is null', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid3 });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 if a Forscher tries to post a token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(forscherHeader1)
        .send(payload);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Untersuchungsteam tries to post a token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(utHeader)
        .send(payload);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and create the Probands token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send(payload);
      expect(result).to.have.status(StatusCodes.OK);
      expect((result.body as FcmToken).fcm_token).to.equal(
        'thisisjustarandomstring'
      );
    });
  });
});
