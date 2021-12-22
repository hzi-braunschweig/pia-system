/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Server } from '../../src/server';
import { db } from '../../src/db';
import { EventEmitter, once } from 'events';
import { MessageQueueService } from '../../src/services/messageQueueService';
import { createSandbox } from 'sinon';
import { MessageQueueClient, Producer } from '@pia/lib-messagequeue';
import { config } from '../../src/config';
import { MessagePayloadProbandDeactivated } from '../../src/models/messagePayloads';
import { getManager, getRepository, Not, Repository } from 'typeorm';
import { Questionnaire } from '../../src/entities/questionnaire';
import {
  createQuestionnaire,
  createQuestionnaireInstance,
} from './instanceCreator.helper';
import { QuestionnaireInstance } from '../../src/entities/questionnaireInstance';
import { expect } from 'chai';
import { QuestionnaireInstanceStatus } from '../../src/models/questionnaireInstance';

describe('MessageQueueService', () => {
  const testSandbox = createSandbox();
  const endOfMessageHandlingEmitter: EventEmitter = new EventEmitter();
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  const pseudonym1 = 'QTestProband1';
  const pseudonym2 = 'QTestProband2';

  let qiRepo: Repository<QuestionnaireInstance>;

  before(async () => {
    await db.none("INSERT INTO studies(name) VALUES ('QTestStudy')");
    await db.none(
      "INSERT INTO probands(pseudonym, study) VALUES ($(pseudonym), 'QTestStudy')",
      { pseudonym: pseudonym1 }
    );
    await db.none(
      "INSERT INTO probands(pseudonym, study) VALUES ($(pseudonym), 'QTestStudy')",
      { pseudonym: pseudonym2 }
    );
    await Server.init();
    await mqc.connect(true);
    qiRepo = getRepository(QuestionnaireInstance);
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'QTest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  afterEach(() => {
    testSandbox.restore();
  });

  describe('onUserDeactivated', () => {
    const endOfUserDeactivated = 'endOfUserDeactivated';
    let producer: Producer<MessagePayloadProbandDeactivated>;
    beforeEach(async () => {
      const stub = testSandbox.stub(MessageQueueService, 'onUserDeactivated');
      stub.callsFake(async (pseudonym) => {
        await stub.wrappedMethod(pseudonym).finally(() => {
          endOfMessageHandlingEmitter.emit(endOfUserDeactivated);
        });
      });
      producer = await mqc.createProducer('proband.deactivated');

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
        await manager.save(
          QuestionnaireInstance,
          createQuestionnaireInstance({
            id: 69100,
            questionnaire: q1,
            status: 'inactive',
            pseudonym: pseudonym2,
          })
        );
      });
    });

    it('should delete the inactive questionnaire instances of the deactivated pseudonym', async () => {
      // Arrange
      const inactiveOfP1Before = await qiRepo.count({
        pseudonym: pseudonym1,
        status: 'inactive',
      });
      expect(inactiveOfP1Before).to.be.greaterThan(0);

      // Act
      await producer.publish({
        pseudonym: pseudonym1,
      });

      // Assert
      await once(endOfMessageHandlingEmitter, endOfUserDeactivated);
      const inactiveOfP1After = await qiRepo.count({
        pseudonym: pseudonym1,
        status: 'inactive',
      });
      expect(inactiveOfP1Before).to.be.greaterThan(inactiveOfP1After);
      expect(inactiveOfP1After).to.equal(0);
    });

    it('should not delete any other questionnaire instance', async () => {
      // Arrange
      const nonInactiveOfP1Before = await qiRepo.count({
        pseudonym: pseudonym1,
        status: Not<QuestionnaireInstanceStatus>('inactive'),
      });
      expect(nonInactiveOfP1Before).to.be.greaterThan(0);
      const allOfP2Before = await qiRepo.count({
        pseudonym: pseudonym2,
      });
      expect(allOfP2Before).to.be.greaterThan(0);

      // Act
      await producer.publish({
        pseudonym: pseudonym1,
      });

      // Assert
      await once(endOfMessageHandlingEmitter, endOfUserDeactivated);
      const nonInactiveOfP1After = await qiRepo.count({
        pseudonym: pseudonym1,
        status: Not<QuestionnaireInstanceStatus>('inactive'),
      });
      const allOfP2After = await qiRepo.count({
        pseudonym: pseudonym2,
      });
      expect(nonInactiveOfP1Before).to.be.equal(nonInactiveOfP1After);
      expect(allOfP2Before).to.equal(allOfP2After);
    });
  });
});
