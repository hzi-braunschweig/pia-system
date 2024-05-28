/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-non-null-assertion */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { useFakeTimers } from 'sinon';
import { RemoveOldEventsCommand } from '../../src/cli/removeOldEventsCommand';
import { dataSourceOptions } from '../../src/db';
import { Event } from '../../src/entity/event';
import { MessageQueueTopic } from '@pia/lib-messagequeue';
import { Configuration } from '../../src/entity/configuration';
import { subDays } from 'date-fns';
import { DataSource } from 'typeorm';

describe('cli remove-old-events', function () {
  const dataSource = new DataSource(dataSourceOptions);
  const clock: sinon.SinonFakeTimers = useFakeTimers(
    new Date(2024, 1, 1, 1, 0, 0, 0)
  );

  beforeEach(async function () {
    await dataSource.initialize();
  });

  afterEach(async function () {
    await dataSource.destroy();
  });

  beforeEach(async function () {
    await dataSource.getRepository(Event).clear();
    await dataSource.getRepository(Configuration).save([
      { id: 'retentionTimeInDays', value: 2 },
      { id: 'active', value: true },
    ]);
  });

  afterEach(function () {
    clock.restore();
  });

  it('should remove events older than the configured retention time', async () => {
    // Arrange
    await setupEventsForPastDays();

    // Act
    await RemoveOldEventsCommand();

    // Assert
    const remainingEvents = await dataSource.getRepository(Event).find({
      order: { timestamp: 'DESC' },
    });

    expect(remainingEvents.map((e) => e.id)).to.deep.equal(
      [4, 5, 6],
      'remaining events do not match the latest three'
    );
  });

  it('should exit when event history is disabled by not configuring it', async () => {
    // Arrange
    await setupEventsForPastDays();
    await dataSource.getRepository(Configuration).delete({});

    // Act
    await RemoveOldEventsCommand();

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
    await RemoveOldEventsCommand();

    // Assert
    const remainingEvents = await dataSource.getRepository(Event).count();
    expect(remainingEvents).to.equal(7);
  });

  async function setupEventsForPastDays(): Promise<void> {
    const events: Partial<Event>[] = [];

    for (let days = 0; days < 7; days++) {
      events.push({
        timestamp: subDays(new Date(), days),
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
