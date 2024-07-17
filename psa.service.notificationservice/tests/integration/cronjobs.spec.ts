/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Cronjobs } from '../../src/cronjobs';
import { Server } from '../../src/server';
import { messageQueueService } from '../../src/services/messageQueueService';

chai.use(sinonChai);

describe('Cronjobs', () => {
  const sandbox = sinon.createSandbox();
  const clock = sinon.useFakeTimers({
    now: new Date(),
    shouldAdvanceTime: true,
  });
  const stubsStart = Cronjobs.map((job) => sandbox.spy(job, 'start'));
  const stubsExecute = Cronjobs.map((job) => ({
    stub: sandbox.stub(job, 'execute'),
    className: job.constructor.name,
  }));

  before(async () => {
    sandbox.stub(messageQueueService, 'connect').resolves();
    sandbox.stub(messageQueueService, 'disconnect').resolves();
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    clock.runAll();
    clock.restore();
    sandbox.restore();
  });

  it('should start all cronjobs', () => {
    expect(stubsStart).to.have.lengthOf(Cronjobs.length);

    for (const stub of stubsStart) {
      expect(stub).to.have.been.calledOnce;
    }
  });

  it('should have executed all cronjobs', (done) => {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const timeout = 24 * 60 * 60 * 1000 + 150; // 24 hours + 150ms

    expect(stubsExecute).to.have.lengthOf(Cronjobs.length);

    setTimeout(() => {
      for (const { className, stub } of stubsExecute) {
        expect(stub, `${className}.execute()`).to.have.been.called;
      }
      done();
    }, timeout);

    clock.tick(timeout);
  });
});
