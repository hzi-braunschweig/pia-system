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
  MessageQueueTestUtils,
  MessageQueueClient,
  MessageQueueTopic,
  MessageQueueMessage,
} from '@pia/lib-messagequeue';
import { EventHistoryServer } from '../../src/server';
import { Event } from '../../src/entity/event';
import { messageQueueService } from '../../src/services/messageQueueService';
import {
  SupportedTopics,
  EventType,
  SupportedMessages,
} from '../../src/events';

interface TestCase {
  topic: EventType;
  message: SupportedMessages;
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

  const testCasesSuccess: TestCase[] = [
    {
      topic: MessageQueueTopic.PROBAND_LOGGED_IN,
      message: { pseudonym: 'stdya-000000001', studyName: 'Study A' },
    },
    {
      topic: MessageQueueTopic.PROBAND_CREATED,
      message: { pseudonym: 'stdya-000000001', studyName: 'Study A' },
    },
    {
      topic: MessageQueueTopic.PROBAND_DELETED,
      message: { pseudonym: 'stdya-000000001', studyName: 'Study A' },
    },
    {
      topic: MessageQueueTopic.PROBAND_DEACTIVATED,
      message: { pseudonym: 'stdya-000000001', studyName: 'Study A' },
    },
    {
      topic: MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
      message: { pseudonym: 'stdya-000000001', studyName: 'Study A' },
    },
    {
      topic: MessageQueueTopic.COMPLIANCE_CREATED,
      message: { pseudonym: 'stdya-000000001', studyName: 'Study A' },
    },
    {
      topic: MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
      message: { id: 1, releaseVersion: 1, studyName: 'Study A' },
    },
  ];

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
        await produceMessage(topic, message);

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

  async function produceMessage(
    topic: MessageQueueTopic,
    message: MessageQueueMessage
  ): Promise<void> {
    const promisedMessage = MessageQueueTestUtils.injectMessageProcessedAwaiter(
      messageQueueService,
      topic
    );

    const producer = await mqc.createProducer(topic);
    await producer.publish(message);

    await promisedMessage;
  }
});
