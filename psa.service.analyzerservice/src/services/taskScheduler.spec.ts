/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox, SinonFakeTimers, SinonStub } from 'sinon';
import chai from 'chai';
import { TaskScheduler } from './taskScheduler';
import { QuestionnaireInstancesService } from './questionnaireInstancesService';
import { startOfToday } from 'date-fns';

const expect = chai.expect;
const sandbox = createSandbox();

describe('TaskScheduler', function () {
  describe('init', () => {
    let clock: SinonFakeTimers;
    let checkStatusStub: SinonStub;

    beforeEach(function () {
      clock = sandbox.useFakeTimers(startOfToday());
      checkStatusStub = sandbox.stub(
        QuestionnaireInstancesService,
        'checkAndUpdateQuestionnaireInstancesStatus'
      );
      TaskScheduler.init();
    });

    afterEach(function () {
      TaskScheduler.stop();
      sandbox.restore();
    });

    it('should fire the task every 5th minute of an hour', function () {
      clock.tick('00:05:00');
      expect(checkStatusStub.callCount).to.equal(1);
      clock.tick('01:00:00');
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expect(checkStatusStub.callCount).to.equal(2);
    });

    it('should fire the task every hour', function () {
      const expectedCallCount = 100;
      for (let i = 0; i < expectedCallCount; i++) {
        clock.tick('01:00:00');
        expect(checkStatusStub.callCount).to.equal(1 + i);
      }
      expect(checkStatusStub.callCount).to.equal(expectedCallCount);
    });
  });
});
