/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers,security/detect-object-injection */

import { getManager, getRepository } from 'typeorm';
import chaiHttp from 'chai-http';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';

import { Server } from '../../src/server';
import { QuestionnaireInstance } from '../../src/entities/questionnaireInstance';
import { Questionnaire } from '../../src/entities/questionnaire';
import { Condition } from '../../src/entities/condition';
import { db } from '../../src/db';
import { config } from '../../src/config';
import {
  QuestionnaireInstanceDto,
  QuestionnaireInstanceStatus,
} from '../../src/models/questionnaireInstance';
import {
  createQuestionnaire,
  createQuestionnaireInstance,
} from './instanceCreator.helper';
import { ConditionType } from '../../src/models/condition';
import { Answer } from '../../src/entities/answer';
import { AnswerOption } from '../../src/entities/answerOption';
import { Question } from '../../src/entities/question';
import {
  CreateQuestionnaireInstanceInternalDto,
  QuestionnaireInstanceOriginInternalDto,
} from '@pia-system/lib-http-clients-internal';
import { QuestionnaireInstanceOrigin } from '../../src/entities/questionnaireInstanceOrigin';
import {
  MessageQueueClient,
  MessageQueueTopic,
  QuestionnaireInstanceCreatedMessage,
} from '@pia/lib-messagequeue';
import { createSandbox } from 'sinon';
import { beforeEach } from 'mocha';
import { waitForConditionToBeTrue } from './public/utilities';
import { QuestionnaireInstanceQueue } from '../../src/entities/questionnaireInstanceQueue';
import sinonChai from 'sinon-chai';

chai.use(chaiHttp);
chai.use(sinonChai);
const apiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: QuestionnaireInstances', () => {
  const testSandbox = createSandbox();
  const mqc = new MessageQueueClient(config.servers.messageQueue);
  const pseudonym1 = 'qtest-proband1';
  const pseudonym2 = 'qtest-proband2';

  let createdInstanceMessages: QuestionnaireInstanceCreatedMessage[] = [];

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
    await mqc.connect(true);
  });

  after(async () => {
    await mqc.disconnect();
    await Server.stop();
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'qtest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  beforeEach(async () => {
    await mqc.createConsumer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED,
      async (message) => {
        createdInstanceMessages.push(message);
        return Promise.resolve();
      }
    );
  });

  afterEach(() => {
    testSandbox.restore();
    createdInstanceMessages = [];
  });

  describe('GET /questionnaire/questionnaireInstances/{id}', () => {
    let questionnaireX: Questionnaire;
    let questionnaireY: Questionnaire;
    let questionnaireInstanceX: QuestionnaireInstance;
    let questionnaireInstanceY: QuestionnaireInstance;

    beforeEach(async () => {
      await getManager().transaction(async (manager) => {
        questionnaireX = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9100 })
        );
        questionnaireInstanceX = await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            questionnaire: questionnaireX,
            status: 'released_twice',
            dateOfIssue: new Date('2020-06-01T02:00'),
            dateOfReleaseV1: new Date('2020-06-03T16:00'),
            dateOfReleaseV2: new Date('2020-06-04T10:00'),
          })
        );
        await manager.save(Answer, [
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[0],
            versioning: 1,
            value: 'Bad',
          },
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[1],
            versioning: 1,
            value: 'Bad',
          },
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[2],
            versioning: 1,
            value: 'Good',
          },
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[3],
            versioning: 1,
            value: 'Good',
          },

          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[0],
            versioning: 2,
            value: 'Bad',
          },
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[1],
            versioning: 2,
            value: 'Good',
          },
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[2],
            versioning: 2,
            value: 'Good',
          },
          {
            questionnaireInstance: questionnaireInstanceX,
            question: questionnaireInstanceX.questionnaire.questions[0],
            answerOption:
              questionnaireInstanceX.questionnaire.questions[0]
                .answerOptions[3],
            versioning: 2,
            value: 'Good',
          },
        ]);

        /**
         * We have two questionnaires X and Y.
         * Y has some questions that depend on X.
         * So for the example questionnaire we want the following dependency.
         * And for the example questionnaire instance we want the condition resolved as following.
         *
         *    -> referenced AnswerOption (Condition) Fulfilled?
         * Y
         *  - 0
         *    - 0 -> X00 (Good == Bad) No
         *    - 1 -> X01 (Good == Good) Yes
         *    - 2 -> Y01 (Intern:Existing) => Yes
         *    ...
         *  - 1   -> Y00 (Intern:Existing) => No
         *    - 0
         *    ...
         */

        const questionnaireYpre = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9200 })
        );
        questionnaireYpre.questions[0].answerOptions[0].condition =
          manager.create(Condition, {
            type: ConditionType.EXTERNAL,
            operand: '==',
            targetAnswerOption: questionnaireX.questions[0].answerOptions[0],
            value: 'Good',
          });
        questionnaireYpre.questions[0].answerOptions[1].condition =
          manager.create(Condition, {
            type: ConditionType.EXTERNAL,
            operand: '==',
            targetAnswerOption: questionnaireX.questions[0].answerOptions[1],
            value: 'Good',
          });
        questionnaireYpre.questions[0].answerOptions[2].condition =
          manager.create(Condition, {
            type: ConditionType.INTERNAL_THIS,
            operand: '==',
            targetAnswerOption: questionnaireYpre.questions[0].answerOptions[1],
            value: 'Good',
          });
        questionnaireYpre.questions[1].condition = manager.create(Condition, {
          type: ConditionType.INTERNAL_THIS,
          operand: '==',
          targetAnswerOption: questionnaireYpre.questions[0].answerOptions[0],
          value: 'Good',
        });
        questionnaireY = await manager.save(Questionnaire, questionnaireYpre);
        questionnaireInstanceY = await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            questionnaire: questionnaireY,
            dateOfIssue: new Date('2020-06-05T02:00'),
          })
        );
      });
    });

    afterEach(async () => {
      await getManager().transaction(async (manager) => {
        await manager.delete(Condition, {});
        await manager.delete(Questionnaire, {});
        await manager.delete(Question, {});
        await manager.delete(AnswerOption, {});
        await manager.delete(Answer, {});
        await manager.delete(QuestionnaireInstance, {});
      });
    });

    it('should return 200 and fetch the questionnaire instance with the questionnaire', async () => {
      const result: { body: QuestionnaireInstanceDto } = await chai
        .request(apiAddress)
        .get(
          `/questionnaire/questionnaireInstances/${questionnaireInstanceY.id}`
        );

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(questionnaireInstanceY.id);
      expect(result.body.questionnaire.id).to.equal(9200);
      expect(result.body.questionnaire.questions).to.have.length(2);
      expect(
        result.body.questionnaire.questions[0].answerOptions
      ).to.have.length(5);
      expect(
        result.body.questionnaire.questions[1].answerOptions
      ).to.have.length(5);
    });

    it('should return 200 and fetch the questionnaire instance with the filtered questionnaire', async () => {
      const result: { body: QuestionnaireInstance } = await chai
        .request(apiAddress)
        .get(
          `/questionnaire/questionnaireInstances/${questionnaireInstanceY.id}`
        )
        .query({
          filterQuestionnaireByConditions: true,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(questionnaireInstanceY.id);
      expect(result.body.questionnaire.id).to.equal(9200);
      expect(result.body.questionnaire.questions).to.have.length(1);
      expect(
        result.body.questionnaire.questions[0].answerOptions.some(
          (ao) => ao.id === questionnaireY.questions[0].answerOptions[0].id
        )
      ).to.be.false;
      expect(
        result.body.questionnaire.questions[0].answerOptions.some(
          (ao) => ao.id === questionnaireY.questions[0].answerOptions[1].id
        )
      ).to.be.true;
      expect(
        result.body.questionnaire.questions[0].answerOptions.some(
          (ao) => ao.id === questionnaireY.questions[0].answerOptions[2].id
        )
      ).to.be.true;
      expect(
        result.body.questionnaire.questions[0].answerOptions.some(
          (ao) => ao.id === questionnaireY.questions[0].answerOptions[3].id
        )
      ).to.be.true;
      expect(
        result.body.questionnaire.questions[0].answerOptions.some(
          (ao) => ao.id === questionnaireY.questions[0].answerOptions[4].id
        )
      ).to.be.true;
      expect(
        result.body.questionnaire.questions[0].answerOptions
      ).to.have.length(4);
    });

    it('should return 404 if questionnaire instance does not exist', async () => {
      const result: { body: QuestionnaireInstanceDto } = await chai
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

  describe('POST /questionnaire/questionnaireInstances', () => {
    const questionnaireId = 1;
    const dateOfIssue = new Date();
    const instancesFixture: CreateQuestionnaireInstanceInternalDto[] = [
      {
        studyId: 'QTestStudy',
        pseudonym: pseudonym1,
        questionnaireName: 'Questionnaire A',
        questionnaireId,
        questionnaireVersion: 1,
        sortOrder: null,
        dateOfIssue,
        cycle: 1,
        status: 'inactive',
        origin: null,
      },
      {
        studyId: 'QTestStudy',
        pseudonym: pseudonym1,
        questionnaireName: 'Questionnaire A',
        questionnaireId,
        questionnaireVersion: 1,
        sortOrder: null,
        dateOfIssue,
        cycle: 2,
        status: 'inactive',
        origin: null,
      },
      {
        studyId: 'QTestStudy',
        pseudonym: pseudonym1,
        questionnaireName: 'Questionnaire A',
        questionnaireId,
        questionnaireVersion: 1,
        sortOrder: null,
        dateOfIssue,
        cycle: 3,
        status: 'inactive',
        origin: null,
      },
      {
        studyId: 'QTestStudy',
        pseudonym: pseudonym1,
        questionnaireName: 'Questionnaire A',
        questionnaireId,
        questionnaireVersion: 1,
        sortOrder: null,
        dateOfIssue,
        cycle: 4,
        status: 'inactive',
        origin: null,
      },
    ];

    beforeEach(async () => {
      await getRepository(Questionnaire).save(
        createQuestionnaire({ id: questionnaireId })
      );
    });

    afterEach(async () => {
      await getRepository(Questionnaire).delete({});
      await getRepository(QuestionnaireInstance).delete({});
      await getRepository(QuestionnaireInstanceOrigin).delete({});
    });

    it('should return 200 and create all instances', async () => {
      const instances = structuredClone(instancesFixture);
      const result: { body: CreateQuestionnaireInstanceInternalDto[] } =
        await chai
          .request(apiAddress)
          .post('/questionnaire/questionnaireInstances')
          .send(instances);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(4);

      for (let idx = 0; idx < result.body.length; idx++) {
        const instanceDto = result.body[idx];

        expect(instanceDto.dateOfIssue).to.equal(dateOfIssue.toISOString());

        delete instanceDto.dateOfIssue;
        delete instances[idx].dateOfIssue;

        expect(instanceDto).to.deep.include(instances[idx]);
        expect(result.body).to.have.length(instances.length);
      }
    });

    it('should return 200 and create all instances and their origin relation', async () => {
      const questionnaire = await getRepository(Questionnaire).save(
        createQuestionnaire({ id: 9100 })
      );
      const originInstance = await getRepository(QuestionnaireInstance).save(
        createQuestionnaireInstance({
          questionnaire,
          status: 'active',
          pseudonym: pseudonym1,
        })
      );
      const condition = await getRepository(Condition).save({
        type: ConditionType.EXTERNAL,
        value: 'Good',
        link: 'AND',
        operand: '==',
        targetAnswerOption: questionnaire.questions[0].answerOptions[0],
        targetQuestionnaire: questionnaire,
        targetQuestionnaireVersion: 1,
        conditionQuestionnaire: questionnaire,
        conditionAnswerOption: questionnaire.questions[0].answerOptions[1],
        conditionTargetQuestionnaire: questionnaire,
        conditionTargetQuestionnaireVersion: 1,
      });
      const origin: QuestionnaireInstanceOriginInternalDto = {
        originInstance: originInstance.id,
        condition: condition.id,
      };

      const instances = structuredClone(instancesFixture).map((instance) => {
        return {
          ...instance,
          origin,
        };
      });

      const result: { body: CreateQuestionnaireInstanceInternalDto[] } =
        await chai
          .request(apiAddress)
          .post('/questionnaire/questionnaireInstances')
          .send(instances);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(instances.length);

      for (let idx = 0; idx < result.body.length; idx++) {
        const instanceDto = result.body[idx];

        expect(instanceDto.dateOfIssue).to.equal(dateOfIssue.toISOString());

        const expectedOrigin: QuestionnaireInstanceOriginInternalDto = {
          ...origin,
          createdInstance: instanceDto.id ?? 0,
        };
        expect(instanceDto.origin).to.deep.equal(expectedOrigin);

        delete instanceDto.dateOfIssue;
        delete instanceDto.origin;
        delete instances[idx].dateOfIssue;
        delete instances[idx].origin;

        expect(instanceDto).to.deep.include(instances[idx]);
        expect(instanceDto.id).to.greaterThan(0);
      }

      const origins = await getRepository(QuestionnaireInstanceOrigin).find({
        relations: ['createdInstance', 'originInstance', 'condition'],
      });
      expect(origins).to.have.length(instances.length);
      expect(origins.map((o) => o.createdInstance.id)).to.have.members(
        result.body.map((qi) => qi.id)
      );
      expect(
        origins.every((o) => o.originInstance.id == originInstance.id)
      ).to.be.equal(true, 'All origins should have the same originInstance');
    });

    it('should return 200 and add flagged instances to queue', async () => {
      // Arrange
      // first two instances should be queued
      const instances = structuredClone(instancesFixture).map(
        (instance, idx) => ({
          ...instance,
          options: { addToQueue: idx < 2 },
        })
      );
      const queuedInstances = instances.filter(
        (instance) => instance.options.addToQueue
      );

      // Act
      const result: { body: CreateQuestionnaireInstanceInternalDto[] } =
        await chai
          .request(apiAddress)
          .post('/questionnaire/questionnaireInstances')
          .send(instances);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(instances.length);

      const queue = await getRepository(QuestionnaireInstanceQueue).find({
        relations: ['questionnaireInstance'],
        loadRelationIds: true,
      });

      expect(queue).to.have.length(queuedInstances.length);

      for (const entry of queue) {
        expect(entry.pseudonym).to.equal(pseudonym1);
        expect(result.body.map((qi) => qi.id)).to.contain(
          entry.questionnaireInstance
        );
        expect(entry.dateOfQueue).to.be.a('Date');
      }
    });

    it('should dispatch a message for every instance created', async () => {
      // Arrange
      const expectedCustomName = 'dummy_custom_name';
      await getRepository(Questionnaire).update(
        { id: 1, version: 1 },
        { customName: expectedCustomName }
      );
      const instances = structuredClone(instancesFixture);

      // Act
      const result: { body: CreateQuestionnaireInstanceInternalDto[] } =
        await chai
          .request(apiAddress)
          .post('/questionnaire/questionnaireInstances')
          .send(instances);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(4);

      const expectedMessages: QuestionnaireInstanceCreatedMessage[] = [];

      for (let idx = 0; idx < result.body.length; idx++) {
        const instanceDto = result.body[idx];
        const instance = instances[idx];
        expectedMessages.push({
          id: instanceDto.id,
          studyName: instance.studyId,
          pseudonym: instance.pseudonym,
          status:
            instance.status as unknown as QuestionnaireInstanceCreatedMessage['status'],
          questionnaire: {
            id: 1,
            customName: expectedCustomName,
          },
        });
      }

      await waitForConditionToBeTrue(
        () => createdInstanceMessages.length === 4
      );

      expect(createdInstanceMessages).to.include.deep.members(expectedMessages);
    });
  });
});
