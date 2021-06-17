const { expect } = require('chai');
const sandbox = require('sinon').createSandbox();
const schedule = require('node-schedule');
const startOfToday = require('date-fns/startOfToday');

const questionnaireInstancesService = require('./questionnaireInstancesService.js');
const sut = require('../../src/services/taskScheduleHelper.js');

describe('taskScheduleHelper', function () {
  let clock;

  afterEach(function () {
    sandbox.restore();
    Object.entries(schedule.scheduledJobs).forEach((job) => job[1].cancel());
  });

  describe('scheduleQuestionnaireInstancesActivator', function () {
    beforeEach(function () {
      clock = require('sinon').useFakeTimers(startOfToday());
      sandbox.stub(
        questionnaireInstancesService,
        'checkAndUpdateQuestionnaireInstancesStatus'
      );
      sut.scheduleQuestionnaireInstancesActivator(null);
    });

    it('should fire the task every 5th minute of an hour', function () {
      clock.tick('00:05:00');
      expect(
        questionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus
          .callCount
      ).to.equal(1);
      clock.tick('01:00:00');
      expect(
        questionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus
          .callCount
      ).to.equal(2);
    });

    it('should fire the task every hour', function () {
      for (let i = 0; i < 100; i++) {
        clock.tick('01:00:00');
        expect(
          questionnaireInstancesService
            .checkAndUpdateQuestionnaireInstancesStatus.callCount
        ).to.equal(1 + i);
      }
      expect(
        questionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus
          .callCount
      ).to.equal(100);
    });
  });
});
