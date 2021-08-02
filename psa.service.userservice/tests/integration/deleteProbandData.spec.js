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
const internalServerAddress = 'http://localhost:' + process.env.INTERNAL_PORT;
const externalServerAddress = 'http://localhost:' + process.env.PORT;
const serverSandbox = require('sinon').createSandbox();

const { db } = require('../../src/db');

const loggingserviceClientStub = require('../../src/clients/loggingserviceClient');
const testSandbox = require('sinon').createSandbox();

describe('delete proband data', () => {
  let deleteLogsStub;

  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(async function () {
    deleteLogsStub = testSandbox
      .stub(loggingserviceClientStub, 'deleteLogs')
      .resolves();

    await cleanUp();
    await db.none('INSERT INTO users VALUES ($1, $2, $3, $4, $5)', [
      'QTestProband1',
      '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
      'Proband',
      '',
      new Date(),
    ]);
    await db.none('INSERT INTO studies VALUES ($1, $2)', [
      'ApiTestStudie',
      'ApiTestStudie Beschreibung',
    ]);
    await db.none('INSERT INTO study_users VALUES($1, $2, $3)', [
      'ApiTestStudie',
      'QTestProband1',
      'read',
    ]);
    await db.none('INSERT INTO questionnaires VALUES($1:csv)', [
      [
        123456,
        'ApiTestStudie',
        'ApiQuestionnaireName1',
        1,
        0,
        'once',
        0,
        0,
        3,
        'not_title',
        'not_body1',
        'not_body1',
      ],
    ]);
    await db.none('INSERT INTO questions VALUES($1:csv)', [
      [123456, 123456, 'question_text', 0],
    ]);
    await db.none(
      'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position) VALUES($1:csv)',
      [[123456, 123456, 'subquestion_text1', 1, null, null, 0]]
    );
    await db.none(
      'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position) VALUES($1:csv)',
      [[123457, 123456, 'subquestion_text2', 1, null, null, 1]]
    );
    await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
      [
        123456,
        'ApiTestStudie',
        123456,
        'ApiQuestionnaireName1',
        'QTestProband1',
        new Date(),
        null,
        null,
        0,
        'active',
      ],
    ]);
    await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
      [
        123457,
        'ApiTestStudie',
        123456,
        'ApiQuestionnaireName1',
        'QTestProband1',
        new Date(),
        null,
        null,
        1,
        'active',
      ],
    ]);
    await db.none('INSERT INTO lab_results VALUES ($1:csv)', [
      ['APISAMPLE_11111', 'QTestProband1'],
    ]);
  });

  afterEach(async function () {
    testSandbox.restore();
    await cleanUp();
  });

  async function cleanUp() {
    await db.none("DELETE FROM lab_results WHERE id = 'APISAMPLE_11111'");
    await db.none(
      "DELETE FROM questionnaire_instances WHERE user_id = 'QTestProband1'"
    );
    await db.none('DELETE FROM answer_options WHERE id = 123456');
    await db.none('DELETE FROM answer_options WHERE id = 123457');
    await db.none('DELETE FROM questions WHERE id = 123456');
    await db.none('DELETE FROM questionnaires WHERE id = 123456');
    await db.none("DELETE FROM study_users WHERE user_id = 'QTestProband1'");
    await db.none("DELETE FROM studies WHERE name = 'ApiTestStudie'");
    await db.none("DELETE FROM users WHERE username = 'QTestProband1'");
  }

  it('should return 404 error if user was not found', async function () {
    const res = await chai
      .request(internalServerAddress)
      .delete('/user/users/DoesNotExist');
    expect(res).to.have.status(404);
  });

  it('should delete user and its data', async function () {
    const res = await chai
      .request(internalServerAddress)
      .delete('/user/users/QTestProband1');
    expect(res).to.have.status(200);

    expect(deleteLogsStub.calledWith('QTestProband1')).to.be.true;

    const users = await db.one(
      "SELECT * FROM users WHERE username = 'QTestProband1'"
    );
    expect(users.account_status).to.equal('deactivated');

    expect(
      await db.manyOrNone(
        "SELECT * FROM lab_results WHERE id = 'APISAMPLE_11111'"
      )
    ).to.be.empty;
    expect(
      await db.manyOrNone(
        "SELECT * FROM questionnaire_instances WHERE user_id = 'QTestProband1'"
      )
    ).to.be.empty;
  });

  it('should not delete user logs if keepUsageData is true', async function () {
    const res = await chai
      .request(internalServerAddress)
      .delete('/user/users/QTestProband1?keepUsageData=true');
    expect(res).to.have.status(200);

    expect(deleteLogsStub.notCalled).to.be.true;
  });

  it('should not delete user and its data from the external interface', async function () {
    const res = await chai
      .request(externalServerAddress)
      .delete('/user/users/QTestProband1');
    expect(res).to.have.status(401);
  });
});
