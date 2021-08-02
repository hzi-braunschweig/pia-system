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
const apiAddress = 'http://localhost:' + process.env.PORT;

const VALID_TEST_AUTH_TOKEN =
  '0123456789012345678901234567890123456789012345678901234567891234';

const defaultData = {
  uuid: 'test',
  firstname: 'test',
  lastname: 'test',
  email: 'test@test.local',
  token: VALID_TEST_AUTH_TOKEN,
};

const header = {
  'Content-Type': 'application/x-www-form-urlencoded',
};

const { db } = require('../../src/db');

describe('connect sormas', function () {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  beforeEach(async function () {
    await db.none('INSERT INTO one_time_auth_token VALUES ($1)', [
      VALID_TEST_AUTH_TOKEN,
    ]);
  });

  afterEach(async function () {
    await db.none('TRUNCATE one_time_auth_token');
  });

  it('should return 403 forbidden on invalid auth token', async function () {
    const testData = Object.assign({}, defaultData);
    testData.token = 'invalid_token';
    const response = await chai
      .request(apiAddress)
      .post('/user/connectSormas')
      .set(header)
      .send(testData);
    expect(response).to.have.status(403);
  });

  it('should accept payload with empty email', async function () {
    const testData = Object.assign({}, defaultData);
    testData.email = '';
    const response = await chai
      .request(apiAddress)
      .post('/user/connectSormas')
      .set(header)
      .send(testData);
    expect(response).to.have.status(200);
    expect(response.text).to.contain(
      'JSON.stringify( {"uuid":"test","email":"","firstname":"test","lastname":"test"}'
    );
  });

  it('should return ejs view containing user data', async function () {
    const response = await chai
      .request(apiAddress)
      .post('/user/connectSormas')
      .set(header)
      .send(defaultData);
    expect(response).to.have.status(200);
    expect(response.text).to.contain(
      'JSON.stringify( {"uuid":"test","email":"test@test.local","firstname":"test","lastname":"test"}'
    );
  });
});
