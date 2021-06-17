const expect = require('chai').expect;
const sinon = require('sinon');

const taskScheduleHelper = require('./taskScheduleHelper');
const labResultImportHelper = require('./labResultImportHelper');

describe('Task Schedule Helper', () => {
  let clock;
  const fullDayInMilliseconds = 24 * 60 * 60 * 1000;

  before(() => (clock = sinon.useFakeTimers()));

  after(() => clock.restore());

  describe('scheduleDailyHL7Import()', () => {
    it('should schedule the daily HL7 import', () => {
      sinon.stub(labResultImportHelper, 'importHl7FromMhhSftp');
      taskScheduleHelper.scheduleDailyHL7Import();

      expect(labResultImportHelper.importHl7FromMhhSftp.called).not.to.be.true;
      clock.tick(fullDayInMilliseconds);
      expect(labResultImportHelper.importHl7FromMhhSftp.calledOnce).to.be.true;
    });
  });

  describe('scheduleDailyCsvImport()', () => {
    it('should schedule the daily csv import', () => {
      sinon.stub(labResultImportHelper, 'importCsvFromHziSftp');
      taskScheduleHelper.scheduleDailyCsvImport();

      expect(labResultImportHelper.importCsvFromHziSftp.called).not.to.be.true;
      clock.tick(fullDayInMilliseconds);
      expect(labResultImportHelper.importCsvFromHziSftp.calledOnce).to.be.true;
    });
  });
});
