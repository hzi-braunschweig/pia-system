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
import {
  MessageQueueClient,
  MessageQueueTopic,
  Producer,
  ProbandDeactivatedMessage,
} from '@pia/lib-messagequeue';
import { config } from '../../src/config';
import {
  FindOperator,
  getManager,
  getRepository,
  In,
  Not,
  Repository,
} from 'typeorm';
import { Questionnaire } from '../../src/entities/questionnaire';
import {
  createQuestionnaire,
  createQuestionnaireInstance,
} from './instanceCreator.helper';
import { QuestionnaireInstance } from '../../src/entities/questionnaireInstance';
import { expect } from 'chai';
import { QuestionnaireInstanceStatus } from '../../src/models/questionnaireInstance';
import { QuestionnaireType } from '../../src/models/questionnaire';

describe('MessageQueueService', () => {
  const testSandbox = createSandbox();
  const endOfMessageHandlingEmitter: EventEmitter = new EventEmitter();
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  const pseudonym1 = 'qtest-proband1';
  const pseudonym2 = 'qtest-proband2';

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
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'qtest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  afterEach(() => {
    testSandbox.restore();
  });

  describe('onUserDeactivated', () => {
    const endOfUserDeactivated = 'endOfUserDeactivated';
    let producer: Producer<ProbandDeactivatedMessage>;
    beforeEach(async () => {
      const stub = testSandbox.stub(MessageQueueService, 'onUserDeactivated');
      stub.callsFake(async (pseudonym) => {
        await stub.wrappedMethod(pseudonym).finally(() => {
          endOfMessageHandlingEmitter.emit(endOfUserDeactivated);
        });
      });
      producer = await mqc.createProducer(
        MessageQueueTopic.PROBAND_DEACTIVATED
      );

      await getManager().transaction(async (manager) => {
        const qForProbands = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9100 })
        );

        const qForResearchTeam = await manager.save(
          Questionnaire,
          createQuestionnaire({ id: 9200, type: 'for_research_team' })
        );

        const allStatus: QuestionnaireInstanceStatus[] = [
          'active',
          'in_progress',
          'released_once',
          'released_twice',
          'expired',
          'inactive',
        ];

        // Generate for each participant, each questionnaire type and each status a questionnaire instance
        for (const questionnaire of [qForProbands, qForResearchTeam]) {
          for (const pseudonym of [pseudonym1, pseudonym2]) {
            for (const status of allStatus) {
              await manager.save(
                QuestionnaireInstance,
                createQuestionnaireInstance({
                  id: undefined,
                  questionnaire,
                  status,
                  pseudonym,
                })
              );
            }
          }
        }
      });
    });

    afterEach(async () => {
      await qiRepo.delete({});
    });

    it('should delete inactive "for_proband" questionnaire instances of the deactivated pseudonym', async () => {
      // Arrange
      const inactiveOfP1Before = await qiRepo.count({
        pseudonym: pseudonym1,
        status: 'inactive',
      });
      expect(inactiveOfP1Before).to.equal(2);

      // Act
      await producer.publish({
        pseudonym: pseudonym1,
        studyName: 'QTestStudy',
      });

      // Assert
      await once(endOfMessageHandlingEmitter, endOfUserDeactivated);
      const inactiveOfP1After = await qiRepo.find({
        relations: ['questionnaire'],
        where: {
          pseudonym: pseudonym1,
          status: 'inactive',
        },
      });
      expect(inactiveOfP1After.length).to.equal(1);
      expect(inactiveOfP1After[0].questionnaire.type).equals(
        'for_research_team'
      );
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
        studyName: 'QTestStudy',
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

    it('should expire active and in progress "for_proband" questionnaire instances of the deactivated pseudonym', async () => {
      // Arrange
      const expectedInstancesCountFromOtherParticipant = await countInstances(
        pseudonym2,
        In(['active', 'in_progress'])
      );
      const expectedExpiredInstancesCount = await countInstances(
        pseudonym1,
        In(['active', 'in_progress', 'expired']),
        'for_probands'
      );
      const expectedReleasedInstancesCount = await countInstances(
        pseudonym1,
        In(['released_once', 'released_twice'])
      );
      const expectedInstancesForResearchTeamCount = await countInstances(
        pseudonym1,
        In(['active', 'in_progress', 'expired']),
        'for_research_team'
      );
      const expectedRemainingInstancesCount =
        expectedReleasedInstancesCount + expectedInstancesForResearchTeamCount;

      // Act
      await producer.publish({
        pseudonym: pseudonym1,
        studyName: 'QTestStudy',
      });

      // Assert
      await once(endOfMessageHandlingEmitter, endOfUserDeactivated);

      const countExpiredForProbands = await countInstances(
        pseudonym1,
        'expired',
        'for_probands'
      );
      expect(countExpiredForProbands).to.equal(
        expectedExpiredInstancesCount,
        'all instances which were active and in progress should be expired'
      );

      const countExpiredForResearchTeam = await countInstances(
        pseudonym1,
        'expired',
        'for_research_team'
      );
      expect(countExpiredForResearchTeam).to.equal(
        1,
        'the initial expired instance should still exist'
      );

      const countNotExpired = await countInstances(
        pseudonym1,
        Not<QuestionnaireInstanceStatus>('expired')
      );
      expect(countNotExpired).to.equal(
        expectedRemainingInstancesCount,
        'all not expired instances should still exist'
      );

      const countFromOtherParticipant = await countInstances(
        pseudonym2,
        In(['active', 'in_progress'])
      );
      expect(countFromOtherParticipant).to.equal(
        expectedInstancesCountFromOtherParticipant,
        'no instances from other participants have expired'
      );
    });
  });

  async function countInstances(
    pseudonym: string,
    status:
      | FindOperator<QuestionnaireInstanceStatus>
      | QuestionnaireInstanceStatus
      | null
      | void,
    type: QuestionnaireType | void
  ): Promise<number> {
    return qiRepo.count({
      relations: ['questionnaire'],
      where: {
        pseudonym,
        ...(status ? { status } : {}),
        ...(type ? { questionnaire: { type } } : {}),
      },
    });
  }
});
