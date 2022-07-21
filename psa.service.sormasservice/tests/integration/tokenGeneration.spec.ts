/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import { getRepository } from 'typeorm';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { SormasOneTimeToken } from '../../src/entities/sormasOneTimeToken';
import {
  RequestTokenResponse,
  RequestTokenResponseSuccess,
} from '../../src/handlers/tokenHandler';
import { TaskScheduler } from '../../src/services/taskScheduler';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const payload = {
  email: config.sormasOnPia.username,
  password: config.sormasOnPia.password,
};

const invalidCredentialsPayload = {
  email: config.sormasOnPia.username,
  password: 'invalid password',
};

describe('token generation', function () {
  const suiteSandbox = sinon.createSandbox();

  before(async function () {
    suiteSandbox.stub(TaskScheduler, 'init');
    suiteSandbox.stub(TaskScheduler, 'stop');
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    await getRepository(SormasOneTimeToken).clear();
  });

  it('should return HTTP 400 if requested without credentials', async function () {
    const res = await chai.request(apiAddress).post('/requestToken');
    expect(res, res.text).to.have.status(StatusCodes.BAD_REQUEST);
  });

  it('should return no token if requested with invalid credentials', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(invalidCredentialsPayload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
    expect((res.body as RequestTokenResponseSuccess).token).to.equal(undefined);
  });

  it('should return no userid if requested with invalid credentials', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(invalidCredentialsPayload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
    expect((res.body as RequestTokenResponseSuccess).userId).to.equal(
      undefined
    );
  });

  it('should return no success if requested with invalid credentials', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(invalidCredentialsPayload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
    expect((res.body as RequestTokenResponse).success).to.be.false;
  });

  it('should return status 200 using correct credentials', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(payload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
  });

  it('should return 64 character auth token', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(payload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
    expect((res.body as RequestTokenResponseSuccess).token).to.not.equal(
      undefined
    );
    const expectedLength = 64;
    expect((res.body as RequestTokenResponseSuccess).token.length).to.equal(
      expectedLength
    );
  });

  it('should return userId', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(payload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
    expect((res.body as RequestTokenResponseSuccess).userId).to.equal(
      config.sormasOnPia.username
    );
  });

  it('should return success', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(payload);
    expect(res, res.text).to.have.status(StatusCodes.OK);
    expect((res.body as RequestTokenResponse).success).to.be.true;
  });

  it('should store auth token to db', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .send(payload);
    const dbRes = await getRepository(SormasOneTimeToken).findOneOrFail({
      order: { createdAt: 'DESC' },
    });
    expect((res.body as RequestTokenResponseSuccess).token).to.equal(
      dbRes.token
    );
  });
});
