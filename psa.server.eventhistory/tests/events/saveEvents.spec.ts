/* eslint-disable security/detect-object-injection,@typescript-eslint/no-unsafe-assignment */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { config } from '../../src/config';
import { dataSource } from '../../src/db';
import {
  MessageQueueClient,
  MessageQueueTopic,
  MessageTopicMap,
} from '@pia/lib-messagequeue';
import { EventHistoryServer } from '../../src/server';
import { Event } from '../../src/entity/event';
import { SupportedTopics, EventType } from '../../src/events';
import { produceMessage } from '../utils';

interface TestCase<T extends EventType> {
  topic: T;
  message: MessageTopicMap[T];
}

describe('save events', () => {
  const server = new EventHistoryServer();
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    await mqc.connect();
    await server.init();
  });

  after(async function () {
    await mqc.disconnect();
    await server.stop();
  });

  beforeEach(async function () {
    await dataSource.getRepository(Event).clear();
  });

  const testCasesSuccess = [
    createEvent(MessageQueueTopic.PROBAND_LOGGED_IN, {
      pseudonym: 'stdya-000000001',
      studyName: 'Study A',
    }),
    createEvent(MessageQueueTopic.PROBAND_CREATED, {
      pseudonym: 'stdya-000000001',
      studyName: 'Study A',
    }),
    createEvent(MessageQueueTopic.PROBAND_DELETED, {
      pseudonym: 'stdya-000000001',
      studyName: 'Study A',
      deletionType: 'default',
    }),
    createEvent(MessageQueueTopic.PROBAND_DEACTIVATED, {
      pseudonym: 'stdya-000000001',
      studyName: 'Study A',
    }),
    createEvent(MessageQueueTopic.PROBAND_EMAIL_VERIFIED, {
      pseudonym: 'stdya-000000001',
      studyName: 'Study A',
    }),
    createEvent(MessageQueueTopic.COMPLIANCE_CREATED, {
      pseudonym: 'stdya-000000001',
      studyName: 'Study A',
    }),
    createEvent(MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED, {
      id: 1,
      studyName: 'Study A',
      pseudonym: 'stdya-000000001',
      status: 'inactive',
      questionnaire: {
        id: 1,
        customName: 'Questionnaire A',
      },
    }),
    createEvent(MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ACTIVATED, {
      id: 1,
      studyName: 'Study A',
      pseudonym: 'stdya-000000001',
      status: 'active',
      questionnaire: {
        id: 1,
        customName: 'Questionnaire A',
      },
    }),
    createEvent(MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ANSWERING_STARTED, {
      id: 1,
      studyName: 'Study A',
      pseudonym: 'stdya-000000001',
      status: 'in_progress',
      questionnaire: {
        id: 1,
        customName: 'Questionnaire A',
      },
    }),
    createEvent(MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED, {
      id: 1,
      studyName: 'Study A',
      pseudonym: 'stdya-000000001',
      status: 'released',
      releaseVersion: 1,
      questionnaire: {
        id: 1,
        customName: 'Questionnaire A',
      },
    }),
    createEvent(MessageQueueTopic.QUESTIONNAIRE_INSTANCE_EXPIRED, {
      id: 1,
      studyName: 'Study A',
      pseudonym: 'stdya-000000001',
      status: 'expired',
      questionnaire: {
        id: 1,
        customName: 'Questionnaire A',
      },
    }),
  ] as const;

  context('test cases', () => {
    it('should include all topics recognized as events', () => {
      const topics = testCasesSuccess.map((testCase) => testCase.topic);
      expect(topics).to.have.members(
        SupportedTopics,
        'topics are missing in test cases'
      );
    });
  });

  context('receiving messages', () => {
    for (const { topic, message } of testCasesSuccess) {
      it(`should save message from topic "${topic}" as an event`, async () => {
        await produceMessage(mqc, topic, message);

        const { studyName, ...payload } = message;

        const events = await dataSource.getRepository(Event).find();
        expect(events).to.have.lengthOf(1);
        expect(events[0]).to.deep.contain({
          type: topic,
          studyName,
          payload,
        });
        expect(events[0]).to.have.property('timestamp');
        expect(events[0]!.timestamp).to.be.instanceOf(Date);
      });
    }
  });

  function createEvent<T extends EventType>(
    topic: T,
    message: MessageTopicMap[T]
  ): TestCase<T> {
    return {
      topic,
      message,
    };
  }
});
