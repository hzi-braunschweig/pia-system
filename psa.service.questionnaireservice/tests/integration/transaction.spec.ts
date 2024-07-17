/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-empty */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { StatusCodes } from 'http-status-codes';
import fetchMocker from 'fetch-mock';

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { cleanup, setup } from './questionnaires.spec.data/setup.helper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { db, runTransaction } from '../../src/db';
import { QuestionnaireInstanceRepository } from '../../src/repositories/questionnaireInstanceRepository';
import { QuestionnaireRepository } from '../../src/repositories/questionnaireRepository';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestStudy1', 'ApiTestStudy3'],
});

const sandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('transaction for "PATCH /admin/{study}/questionnaires/{id}/{version}"', function () {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    sandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);

    AuthServerMock.adminRealm().returnValid();
    AuthServerMock.probandRealm().returnInvalid();
  });

  afterEach(async () => {
    await cleanup();

    sandbox.restore();
    fetchMock.restore();

    AuthServerMock.cleanAll();
  });

  it('should deactive the questionnaire and delete specific questionnaire_instances if everything runs successfully', async function () {
    const result = await chai
      .request(apiAddress)
      .patch('/admin/ApiTestStudy1/questionnaires/100300/1')
      .set(forscherHeader)
      .send({ active: false });

    expect(result).to.have.status(StatusCodes.OK);
    expect(result.body.id).to.equal(100300);
    expect(result.body.active).to.equal(false);

    const questionnaireFromDatabase = await db.oneOrNone(
      'SELECT id, active FROM questionnaires WHERE id=100300'
    );
    expect(questionnaireFromDatabase).to.deep.equal({
      id: 100300,
      active: false,
    });

    const questionnaireInstancesFromDatabase = await db.manyOrNone(
      'SELECT id FROM questionnaire_instances WHERE questionnaire_id=100300'
    );
    expect(questionnaireInstancesFromDatabase).to.deep.equal([{ id: 140300 }]);
  });

  it('should not deactivate the questionnaire if deleting specific questionnaire_instances fails', async function () {
    sinon
      .stub(
        QuestionnaireInstanceRepository,
        'deleteQuestionnaireInstancesByQuestionnaireId'
      )
      .callsFake(async () => Promise.reject(new Error('Simulated failure')));

    const result = await chai
      .request(apiAddress)
      .patch('/admin/ApiTestStudy1/questionnaires/100300/1')
      .set(forscherHeader)
      .send({ active: false });

    expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);

    const questionnaireFromDatabase = await db.oneOrNone(
      'SELECT id, active FROM questionnaires WHERE id=100300'
    );
    expect(questionnaireFromDatabase).to.deep.equal({
      id: 100300,
      active: true,
    });

    const questionnaireInstancesFromDatabase = await db.manyOrNone(
      'SELECT id FROM questionnaire_instances WHERE questionnaire_id=100300'
    );
    expect(questionnaireInstancesFromDatabase).to.deep.equal([
      { id: 110300 },
      { id: 120300 },
      { id: 130300 },
      { id: 140300 },
    ]);
  });

  it('should not delete the questionnaire_instances if deactivating the questionnaire fails', async function () {
    sinon
      .stub(QuestionnaireRepository, 'deactivateQuestionnaire')
      .callsFake(async () => Promise.reject(new Error('Simulated failure')));

    const result = await chai
      .request(apiAddress)
      .patch('/admin/ApiTestStudy1/questionnaires/100300/1')
      .set(forscherHeader)
      .send({ active: false });

    expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);

    const questionnaireFromDatabase = await db.oneOrNone(
      'SELECT id, active FROM questionnaires WHERE id=100300'
    );
    expect(questionnaireFromDatabase).to.deep.equal({
      id: 100300,
      active: true,
    });

    const questionnaireInstancesFromDatabase = await db.manyOrNone(
      'SELECT id FROM questionnaire_instances WHERE questionnaire_id=100300'
    );
    expect(questionnaireInstancesFromDatabase).to.deep.equal([
      { id: 110300 },
      { id: 120300 },
      { id: 130300 },
      { id: 140300 },
    ]);
  });

  describe('statement timeout', () => {
    it('should not commit changes if a statement_timeout happens', async function () {
      try {
        await transactionWithStatementTimeout(true);
        expect.fail('transaction did not reject');
      } catch (e) {}

      const questionnaireFromDatabase = await db.oneOrNone(
        'SELECT id, active FROM questionnaires WHERE id=100300'
      );
      expect(questionnaireFromDatabase).to.deep.equal({
        id: 100300,
        active: true,
      });
      const questionnaireInstancesFromDatabase = await db.manyOrNone(
        'SELECT id FROM questionnaire_instances WHERE questionnaire_id=100300'
      );
      expect(questionnaireInstancesFromDatabase).to.deep.equal([
        { id: 110300 },
        { id: 120300 },
        { id: 130300 },
        { id: 140300 },
      ]);
    });

    it('should commit changes if the statement_timeout does not happen', async function () {
      await transactionWithStatementTimeout(false);

      const questionnaireFromDatabase = await db.oneOrNone(
        'SELECT id, active FROM questionnaires WHERE id=100300'
      );
      expect(questionnaireFromDatabase).to.deep.equal({
        id: 100300,
        active: false,
      });
      const questionnaireInstancesFromDatabase = await db.manyOrNone(
        'SELECT id FROM questionnaire_instances WHERE questionnaire_id=100300'
      );
      expect(questionnaireInstancesFromDatabase).to.deep.equal([]);
    });
  });

  describe('lock timeout', () => {
    it('the second instance of transactionWithLockTimeout should fail if a lock_timeout happens', async function () {
      const firstTransaction = transactionWithLockTimeout(
        true,
        'first-transaction'
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        await transactionWithLockTimeout(true, 'second-transaction');
        expect.fail('transaction did not reject');
      } catch (e) {}
      await firstTransaction;

      const questionnaireFromDatabase = await db.oneOrNone(
        'SELECT id, name FROM questionnaires WHERE id=100300'
      );
      expect(questionnaireFromDatabase).to.deep.equal({
        id: 100300,
        name: 'first-transaction',
      });
      const questionnaireInstancesFromDatabase = await db.manyOrNone(
        'SELECT questionnaire_name FROM questionnaire_instances WHERE questionnaire_id=100300'
      );
      expect(questionnaireInstancesFromDatabase).to.deep.equal([
        { questionnaire_name: 'first-transaction' },
        { questionnaire_name: 'first-transaction' },
        { questionnaire_name: 'first-transaction' },
        { questionnaire_name: 'first-transaction' },
      ]);
    });

    it('no instance of transactionWithLockTimeout should fail if no lock_timeout happens', async function () {
      const firstTransaction = transactionWithLockTimeout(
        false,
        'first-transaction'
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      await transactionWithLockTimeout(false, 'second-transaction');
      await firstTransaction;

      const questionnaireFromDatabase = await db.oneOrNone(
        'SELECT id, name FROM questionnaires WHERE id=100300'
      );
      expect(questionnaireFromDatabase).to.deep.equal({
        id: 100300,
        name: 'second-transaction',
      });
      const questionnaireInstancesFromDatabase = await db.manyOrNone(
        'SELECT questionnaire_name FROM questionnaire_instances WHERE questionnaire_id=100300'
      );
      expect(questionnaireInstancesFromDatabase).to.deep.equal([
        { questionnaire_name: 'second-transaction' },
        { questionnaire_name: 'second-transaction' },
        { questionnaire_name: 'second-transaction' },
        { questionnaire_name: 'second-transaction' },
      ]);
    });
  });
});

async function transactionWithLockTimeout(
  withLowTimeout: boolean,
  newName: string
): Promise<void> {
  const filter = {
    id: 100300,
    version: 1,
    questionnaireId: 100300,
    questionnaireVersion: 1,
    newName,
  };

  return await runTransaction(async (transaction) => {
    await transaction.none(
      `SET LOCAL lock_timeout = '${withLowTimeout ? 10 : 100000}ms'`
    );

    await transaction.none(
      'UPDATE questionnaire_instances SET questionnaire_name = ${newName} WHERE questionnaire_id = $(questionnaireId) AND questionnaire_version = $(questionnaireVersion)',
      filter
    );
    await transaction.one('SELECT pg_sleep(2)');
    await transaction.none(
      'UPDATE questionnaires SET name = ${newName} WHERE id = $(id) AND version = $(version)',
      filter
    );
  });
}

async function transactionWithStatementTimeout(
  shouldReject: boolean
): Promise<void> {
  const filter = {
    id: 100300,
    version: 1,
    questionnaireId: 100300,
    questionnaireVersion: 1,
  };

  return await runTransaction(async (transaction) => {
    await transaction.none(
      `SET LOCAL statement_timeout = '${shouldReject ? 10 : 1000000}ms'`
    );

    await transaction.none(
      'DELETE FROM questionnaire_instances WHERE questionnaire_id = $(questionnaireId) AND questionnaire_version = $(questionnaireVersion)',
      filter
    );
    await transaction.one('SELECT pg_sleep(2)');
    await transaction.none(
      'UPDATE questionnaires SET active = FALSE WHERE id = $(id) AND version = $(version)',
      filter
    );
  });
}
