const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const expect = require('chai').expect;
const taskScheduleHelper = require('./taskScheduleHelper');

const modysImportService = require('./modysImportService');

describe('taskScheduleHelper', function () {
  describe('scheduleUpdatesFromMODYS', function () {
    let clock;
    let updatePersonalDataStub;

    before(function () {
      clock = sandbox.useFakeTimers(new Date(2000, 5, 5, 0, 0, 0));
      updatePersonalDataStub = sandbox.stub(
        modysImportService,
        'updatePersonalData'
      );
      taskScheduleHelper.scheduleUpdatesFromModys();
    });

    after(function () {
      sandbox.restore();
    });

    it('should not fire the task before 10pm', function () {
      expect(updatePersonalDataStub.callCount).to.equal(0);
      clock.tick('21:00:00');
      expect(updatePersonalDataStub.callCount).to.equal(0);
    });

    it('should fire the task arround 10pm on the same day', function () {
      clock.tick('23:00:00');
      expect(updatePersonalDataStub.callCount).to.equal(1);
    });

    it('should fire the task 10 times in 10 days', function () {
      for (let i = 0; i < 10; i++) {
        clock.tick('24:00:00');
      }

      expect(updatePersonalDataStub.callCount).to.equal(11);
    });
  });
});
