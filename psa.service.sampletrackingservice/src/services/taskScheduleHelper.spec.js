/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const expect = require('chai').expect;
const sinon = require('sinon');

const taskScheduleHelper = require('./taskScheduleHelper');
const { LabResultImportHelper } = require('./labResultImportHelper');

describe('Task Schedule Helper', () => {
  let clock;
  const fullDayInMilliseconds = 24 * 60 * 60 * 1000;

  before(() => (clock = sinon.useFakeTimers()));

  after(() => clock.restore());

  describe('scheduleDailyHL7Import()', () => {
    it('should schedule the daily HL7 import', () => {
      sinon.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
      taskScheduleHelper.scheduleDailyHL7Import();

      expect(LabResultImportHelper.importHl7FromMhhSftp.called).not.to.be.true;
      clock.tick(fullDayInMilliseconds);
      expect(LabResultImportHelper.importHl7FromMhhSftp.calledOnce).to.be.true;
    });
  });

  describe('scheduleDailyCsvImport()', () => {
    it('should schedule the daily csv import', () => {
      sinon.stub(LabResultImportHelper, 'importCsvFromHziSftp');
      taskScheduleHelper.scheduleDailyCsvImport();

      expect(LabResultImportHelper.importCsvFromHziSftp.called).not.to.be.true;
      clock.tick(fullDayInMilliseconds);
      expect(LabResultImportHelper.importCsvFromHziSftp.calledOnce).to.be.true;
    });
  });
});
