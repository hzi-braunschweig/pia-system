/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';
const { config } = require('../../src/config');

const headers = {
  Authorization:
    'Basic ' +
    Buffer.from(
      config.sormasOnPiaUser + ':' + config.sormasOnPiaPassword
    ).toString('base64'),
  'Content-Type': 'application/json',
};

const invalidCredentialsHeaders = {
  Authorization:
    'Basic ' +
    Buffer.from(config.sormasOnPiaUser + ':invalidPassword').toString('base64'),
  'Content-Type': 'application/json',
};

const { db } = require('../../src/db');

const resetFailedLogins = async function () {
  await db.none(
    "UPDATE users SET number_of_wrong_attempts=null, third_wrong_password_at=null WHERE username='sormas-client'"
  );
};

describe('token generation', function () {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
    await resetFailedLogins();
  });

  beforeEach(async function () {
    await db.none('TRUNCATE one_time_auth_token');
    await resetFailedLogins();
  });

  it('should return HTTP 401 if requested without credentials', async function () {
    const res = await chai.request(apiAddress).post('/requestToken');
    expect(res, res.text).to.have.status(401);
  });

  it('should return HTTP 401 if requested with invalid credentials', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(invalidCredentialsHeaders)
      .send(null);
    expect(res, res.text).to.have.status(401);
  });

  it('should return status 200 using correct credentials', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(headers)
      .send(null);
    expect(res, res.text).to.have.status(200);
  });

  it('should return 64 character auth token', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(headers)
      .send(null);
    expect(res, res.text).to.have.status(200);
    expect(res.body.auth).to.not.equal(undefined);
    expect(res.body.auth.length).to.equal(64);
  });

  it('should store auth token to db', async function () {
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(headers)
      .send(null);
    const dbRes = await db.one(
      'SELECT token FROM one_time_auth_token ORDER BY created_at DESC LIMIT 1'
    );
    expect(res.body.auth).to.equal(dbRes.token);
  });

  /* This test has currently side effects and thus is skipped */
  it.skip('should ban user after 3 failed login attempts', async function () {
    await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(invalidCredentialsHeaders)
      .send(null);
    await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(invalidCredentialsHeaders)
      .send(null);
    await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(invalidCredentialsHeaders)
      .send(null);
    const res = await chai
      .request(apiAddress)
      .post('/requestToken')
      .set(invalidCredentialsHeaders)
      .send(null);
    expect(res).to.have.status(403);
    expect(res.body.message).to.have.string(
      'User has 3 failed login attempts and is banned'
    );
  });
});
