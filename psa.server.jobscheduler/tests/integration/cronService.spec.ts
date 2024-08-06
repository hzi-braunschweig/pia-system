/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { CronService } from '../../src/services/cronService';
import { MessageQueueTopic } from '@pia/lib-messagequeue';
import sinon from 'sinon';
import { messageQueueService } from '../../src/services/messageQueueService';

chai.use(sinonChai);
chai.use(chaiHttp);

describe('CronService', () => {
  const clock = sinon.useFakeTimers({
    now: new Date(),
    shouldAdvanceTime: true,
  });

  let cronService: CronService;

  const cronTabFixture: Map<MessageQueueTopic, string> = new Map([
    ['topic1' as unknown as MessageQueueTopic, '*/15 * * * *'],
    ['topic2' as unknown as MessageQueueTopic, '0 * * * *'],
    ['topic3' as unknown as MessageQueueTopic, '0 0 * * *'],
  ]);

  after(() => {
    clock.runAll();
    clock.restore();
  });

  beforeEach(() => {
    cronService = new CronService();
  });

  afterEach(() => {
    cronService.stopAll();
  });

  it('should setup all available cronjobs', () => {
    cronService.setup(cronTabFixture);
    expect(cronService.cronJobs.length).to.equal(cronTabFixture.size);
  });

  it('should start all available cronjobs', (done) => {
    // Prepare
    const timeout = 1000 * 24 * 60 * 60 + 150; // 24h + 150ms

    const messageQueueServiceSpy = sinon.spy(
      messageQueueService,
      'publishMessageForTopic'
    );

    // Act
    cronService.setup(cronTabFixture);
    cronService.startAll();

    // Assert
    setTimeout(() => {
      for (const topic of cronTabFixture.keys()) {
        expect(messageQueueServiceSpy).to.have.been.calledWith(topic);
      }
      done();
    }, timeout);

    // progress the clock so all cronjobs have been executed at least once
    clock.tick(timeout);
  });
});
