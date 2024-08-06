/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { useFakeTimers } from 'sinon';
import { dataSource } from '../../src/db';
import { Event } from '../../src/entity/event';
import { MessageQueueClient, MessageQueueTopic } from '@pia/lib-messagequeue';
import { Configuration } from '../../src/entity/configuration';
import { subDays } from 'date-fns';
import { config } from '../../src/config';
import { produceMessage } from '../utils';
import { EventHistoryServer } from '../../src/server';
import { EventRepository } from '../../src/repositories/eventRepository';

describe('Cleanup event ', () => {
  const mqc = new MessageQueueClient(config.servers.messageQueue);
  const server = new EventHistoryServer();

  const currentDate = new Date(2024, 1, 15, 1, 0, 0, 0);
  const clock: sinon.SinonFakeTimers = useFakeTimers(currentDate);

  before(async () => {
    await mqc.connect(true);
    await server.init();
    await dataSource.getRepository(Configuration).save([
      { id: 'retentionTimeInDays', value: 2 },
      { id: 'active', value: true },
    ]);
  });

  after(async () => {
    await mqc.disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await EventRepository.clear();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should remove events older than the configured retention time', async () => {
    // Arrange
    await setupEventsForPastDays();

    // Act
    await produceMessage(
      mqc,
      MessageQueueTopic.JOB_EVENTHISTORY_CLEANUP_EVENTS
    );

    // Assert
    const remainingEvents = await dataSource.getRepository(Event).find({
      order: { timestamp: 'DESC' },
    });

    expect(remainingEvents.length).to.equal(3);

    for (let day = 0; day < 3; day++) {
      expect(remainingEvents[day]!.timestamp).to.deep.equal(
        subDays(currentDate, day)
      );
    }
  });

  it('should exit when event history is disabled by not configuring it', async () => {
    // Arrange
    await setupEventsForPastDays();
    await dataSource.getRepository(Configuration).delete({});

    // Act
    await produceMessage(
      mqc,
      MessageQueueTopic.JOB_EVENTHISTORY_CLEANUP_EVENTS
    );

    // Assert
    const remainingEvents = await dataSource.getRepository(Event).count();
    expect(remainingEvents).to.equal(7);
  });

  it('should exit when event history is disabled by setting it to inactive', async () => {
    // Arrange
    await setupEventsForPastDays();
    await dataSource
      .getRepository(Configuration)
      .update('active', { value: false });

    // Act
    await produceMessage(
      mqc,
      MessageQueueTopic.JOB_EVENTHISTORY_CLEANUP_EVENTS
    );

    // Assert
    const remainingEvents = await dataSource.getRepository(Event).count();
    expect(remainingEvents).to.equal(7);
  });

  async function setupEventsForPastDays(): Promise<void> {
    const events: Partial<Event>[] = [];

    for (let day = 0; day < 7; day++) {
      events.push({
        timestamp: subDays(currentDate, day),
        type: MessageQueueTopic.PROBAND_LOGGED_IN,
        studyName: 'Study',
        payload: {
          pseudonym: 'stdya-000000001',
        },
      });
    }

    await dataSource.getRepository(Event).save(events);
  }
});
