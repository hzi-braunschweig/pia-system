/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { getManager } from 'typeorm';
import chaiHttp from 'chai-http';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';

import { Server } from '../../src/server';
import { QuestionnaireInstance } from '../../src/entities/questionnaireInstance';
import { Questionnaire } from '../../src/entities/questionnaire';
import { db } from '../../src/db';
import { config } from '../../src/config';
import { QuestionnaireInstanceStatus } from '../../src/models/questionnaireInstance';
import {
  createQuestionnaire,
  createQuestionnaireInstance,
} from './instanceCreator.helper';

chai.use(chaiHttp);
const apiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: QuestionnaireInstances', () => {
  const pseudonym1 = 'QTestProband1';
  const pseudonym2 = 'QTestProband2';
  before(async () => {
    await db.none("INSERT INTO studies(name) VALUES ('QTestStudy')");
    await db.none(
      "INSERT INTO probands(pseudonym, study) VALUES ($(pseudonym), 'QTestStudy')",
      {
        pseudonym: pseudonym1,
      }
    );
    await db.none(
      "INSERT INTO probands(pseudonym, study) VALUES ($(pseudonym), 'QTestStudy')",
      {
        pseudonym: pseudonym2,
      }
    );
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'QTest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  describe('GET /questionnaire/questionnaireInstances/{id}', () => {
    beforeEach(async () => {
      await getManager().transaction(async (manager) => {
        const q1 = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9100 })
        );
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({ id: 19100, questionnaire: q1 })
        );
      });
    });
    afterEach(async () => {
      await getManager().transaction(async (manager) => {
        await manager.delete(Questionnaire, {});
        await manager.delete(QuestionnaireInstance, {});
      });
    });
    it('should return 200 and fetch the questionnaire instance with the questionnaire', async () => {
      const result: { body: QuestionnaireInstance } = await chai
        .request(apiAddress)
        .get('/questionnaire/questionnaireInstances/19100');

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(19100);
      expect(result.body.questionnaire.id).to.equal(9100);
    });
    it('should return 404 if questionnaire instance does not exist', async () => {
      const result: { body: QuestionnaireInstance } = await chai
        .request(apiAddress)
        .get('/questionnaire/questionnaireInstances/29100');

      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
  describe('GET /questionnaire/user/{pseudonym}/questionnaireInstances', () => {
    beforeEach(async () => {
      await getManager().transaction(async (manager) => {
        const q1 = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9100 })
        );
        const q2 = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9200 })
        );
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            id: 19100,
            questionnaire: q1,
            status: 'active',
            pseudonym: pseudonym1,
          })
        );
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            id: 29100,
            questionnaire: q1,
            status: 'inactive',
            pseudonym: pseudonym1,
          })
        );
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            id: 39200,
            questionnaire: q2,
            status: 'in_progress',
            pseudonym: pseudonym1,
          })
        );
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            id: 49200,
            questionnaire: q2,
            status: 'released_twice',
            pseudonym: pseudonym1,
          })
        );
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            id: 59200,
            questionnaire: q2,
            status: 'released_twice',
            pseudonym: pseudonym2,
          })
        );
      });
    });
    afterEach(async () => {
      await getManager().transaction(async (manager) => {
        await manager.delete(Questionnaire, {});
        await manager.delete(QuestionnaireInstance, {});
      });
    });
    it('should return 200 and questionnaire instances filtered by default with questionnaires', async () => {
      const result: { body: QuestionnaireInstance[] } = await chai
        .request(apiAddress)
        .get(`/questionnaire/user/${pseudonym1}/questionnaireInstances`)
        .query({
          loadQuestionnaire: true,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(3);
      for (const qi of result.body) {
        expect(qi).to.have.ownProperty('questionnaire');
        expect(qi.questionnaire).to.be.an('object');
      }
    });
    it('should return 200 and questionnaire instances filtered by default without questionnaires', async () => {
      const result: { body: QuestionnaireInstance[] } = await chai
        .request(apiAddress)
        .get(`/questionnaire/user/${pseudonym1}/questionnaireInstances`);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(3);
      for (const qi of result.body) {
        expect(qi).to.not.have.ownProperty('questionnaire');
        expect(qi.questionnaire).to.be.undefined;
      }
    });
    it('should return 200 and selected questionnaire instances with questionnaires', async () => {
      const statusFilter: QuestionnaireInstanceStatus[] = [
        'inactive',
        'active',
      ];
      const result: { body: QuestionnaireInstance[] } = await chai
        .request(apiAddress)
        .get(`/questionnaire/user/${pseudonym1}/questionnaireInstances`)
        .query({
          status: statusFilter,
          loadQuestionnaire: true,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(2);
      for (const qi of result.body) {
        expect(statusFilter).to.include(qi.status);
        expect(qi).to.have.ownProperty('questionnaire');
        expect(qi.questionnaire).to.be.an('object');
      }
    });
    it('should return 200 and selected questionnaire instances without questionnaires', async () => {
      const statusFilter: QuestionnaireInstanceStatus[] = [
        'inactive',
        'active',
      ];
      const result: { body: QuestionnaireInstance[] } = await chai
        .request(apiAddress)
        .get(`/questionnaire/user/${pseudonym1}/questionnaireInstances`)
        .query({
          status: statusFilter,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(2);
      for (const qi of result.body) {
        expect(statusFilter).to.include(qi.status);
        expect(qi).to.not.have.ownProperty('questionnaire');
        expect(qi.questionnaire).to.be.undefined;
      }
    });
    it('should return 200 and an empty array, if no questionnaire instance matches the filter', async () => {
      const statusFilter: QuestionnaireInstanceStatus[] = ['expired'];
      const result: { body: QuestionnaireInstance[] } = await chai
        .request(apiAddress)
        .get(`/questionnaire/user/${pseudonym1}/questionnaireInstances`)
        .query({
          loadQuestionnaire: false,
          status: statusFilter,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(0);
    });
  });
});
