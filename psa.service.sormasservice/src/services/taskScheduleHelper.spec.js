const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const startOfToday = require('date-fns/startOfToday');

const questionnaireInstancesServiceStub = {
  checkAndUploadQuestionnaireInstances: sinon.stub().resolves(),
};

const expiredUsersDeletionServiceStub = {
  checkAndDeleteExpiredUsers: sinon.stub().resolves(),
};

const tsh = proxyquire('./taskScheduleHelper.js', {
  './questionnaireInstancesService.js': questionnaireInstancesServiceStub,
  './expiredUsersDeletionService': expiredUsersDeletionServiceStub,
});

describe('taskScheduleHelper', function () {
  describe('scheduleQuestionnaireInstancesUploader', function () {
    let clock;

    before(function () {
      clock = sinon.useFakeTimers(startOfToday());
      tsh.scheduleQuestionnaireInstancesUploader(null);
    });

    after(function () {
      clock.restore();
    });

    it('should not fire the task before 1am on the next day', function () {
      expect(
        questionnaireInstancesServiceStub.checkAndUploadQuestionnaireInstances
          .callCount
      ).to.equal(0);
      clock.tick('00:45:00');
      expect(
        questionnaireInstancesServiceStub.checkAndUploadQuestionnaireInstances
          .callCount
      ).to.equal(0);
    });

    it('should fire the task around 1am on the next day', function () {
      clock.tick('01:15:00');
      expect(
        questionnaireInstancesServiceStub.checkAndUploadQuestionnaireInstances
          .callCount
      ).to.equal(1);
    });

    it('should fire the task 10 times in 10 days', function () {
      for (let i = 0; i < 10; i++) {
        clock.tick('24:00:00');
      }

      expect(
        questionnaireInstancesServiceStub.checkAndUploadQuestionnaireInstances
          .callCount
      ).to.equal(11);
    });
  });
});
