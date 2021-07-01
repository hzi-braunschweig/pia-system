import { createSandbox, SinonFakeTimers, SinonStub } from 'sinon';
import chai from 'chai';
import { TaskScheduler } from './taskScheduler';
import { ModysImportService } from './modysImportService';

const expect = chai.expect;
const sandbox = createSandbox();

describe('TaskScheduler', function () {
  describe('init', () => {
    let clock: SinonFakeTimers;
    let startImportStub: SinonStub;

    beforeEach(function () {
      const simulatedYear = 2000;
      const simulatedMonth = 5;
      const simulatedDay = 5;
      clock = sandbox.useFakeTimers(
        new Date(simulatedYear, simulatedMonth, simulatedDay, 0, 0, 0)
      );
      startImportStub = sandbox.stub(ModysImportService, 'startImport');
      TaskScheduler.init();
    });

    afterEach(function () {
      TaskScheduler.stop();
      sandbox.restore();
    });

    it('should not fire the task before 10pm', function () {
      expect(startImportStub.callCount).to.equal(1);
      clock.tick('21:00:00');
      expect(startImportStub.callCount).to.equal(1);
    });

    it('should fire the task arround 10pm on the same day', function () {
      const expectedCallCount = 2;
      clock.tick('23:00:00');
      expect(startImportStub.callCount).to.equal(expectedCallCount);
    });

    it('should fire the task 11 times in 10 days', function () {
      const simulatedDays = 10;
      const expectedCallCount = 11;
      for (let i = 0; i < simulatedDays; i++) {
        console.log(i);
        clock.tick('24:00:00');
      }

      expect(startImportStub.callCount).to.equal(expectedCallCount);
    });
  });
});
