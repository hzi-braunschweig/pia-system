/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox, SinonFakeTimers, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import chai, { expect } from 'chai';
import { TaskScheduler } from './taskScheduler';
import { ExpiredUsersDeletionService } from './expiredUsersDeletionService';

chai.use(sinonChai);

describe('TaskScheduler', function () {
  const HOURS_PER_DAY = 24;
  const sandbox = createSandbox();

  describe('init', () => {
    let clock: SinonFakeTimers;
    let deleteStub: SinonStub;
    let setStatusStub: SinonStub;

    beforeEach(function () {
      const simulatedYear = 2000;
      const simulatedMonth = 5;
      const simulatedDay = 5;
      clock = sandbox.useFakeTimers(
        new Date(simulatedYear, simulatedMonth, simulatedDay, 0, 0, 1)
      );
      deleteStub = sandbox
        .stub(
          ExpiredUsersDeletionService,
          'deleteProbandsIfEveryQIIsReleasedAndTransmitted'
        )
        .resolves();
      setStatusStub = sandbox
        .stub(
          ExpiredUsersDeletionService,
          'setProbandsDeactivatedIfFollowUpEndDateIsReached'
        )
        .resolves();
      TaskScheduler.init();
      expect(deleteStub).to.have.callCount(0);
      expect(setStatusStub).to.have.callCount(0);
    });

    afterEach(function () {
      TaskScheduler.stop();
      sandbox.restore();
    });

    it('should fire the delete job every day once', function () {
      console.log(new Date());
      clock.tick('24:00:00');
      console.log(new Date());
      expect(deleteStub, 'deleteStub: 24 hours later').to.have.callCount(1);
    });

    it('should fire the update job once every hour', function () {
      console.log(new Date());
      clock.tick('24:00:00');
      console.log(new Date());
      expect(setStatusStub, 'setStatusStub: 24 hours later').to.have.callCount(
        HOURS_PER_DAY
      );
    });

    it('should run the delete job at 1 am', function () {
      console.log(new Date(), 'START');
      clock.tick('01:00:00');
      console.log(new Date());
      expect(deleteStub, 'deleteStub: 1 hour later').to.have.callCount(1);
    });

    it('should run the deactivate job every hour at 0. minute', function () {
      console.log(new Date(), 'START');
      for (let hours = 0; hours <= HOURS_PER_DAY; hours++) {
        clock.tick('00:59:58');
        expect(
          setStatusStub,
          `setStatusStub: ${hours} hours + 59:58 minutes later`
        ).to.have.callCount(hours);
        clock.tick('00:00:02');
        console.log(new Date());
        expect(
          setStatusStub,
          `setStatusStub: ${hours + 1} hours later`
        ).to.have.callCount(hours + 1);
      }
    });
  });
});
