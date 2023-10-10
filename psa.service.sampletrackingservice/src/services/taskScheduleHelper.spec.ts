/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import { TaskScheduleHelper } from './taskScheduleHelper';
import { LabResultImportHelper } from './labResultImportHelper';

describe('Task Schedule Helper', () => {
  let clock: sinon.SinonFakeTimers;
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const fullDayInMilliseconds = 24 * 60 * 60 * 1000;

  before(() => (clock = sinon.useFakeTimers()));

  after(() => clock.restore());

  describe('scheduleDailyHL7Import()', () => {
    it('should schedule the daily HL7 import', () => {
      const stub = sinon.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
      TaskScheduleHelper.scheduleDailyHL7Import();

      expect(stub.notCalled).to.be.true;
      clock.tick(fullDayInMilliseconds);
      expect(stub.calledOnce).to.be.true;
    });
  });

  describe('scheduleDailyCsvImport()', () => {
    it('should schedule the daily csv import', () => {
      const stub = sinon.stub(LabResultImportHelper, 'importCsvFromHziSftp');
      TaskScheduleHelper.scheduleDailyCsvImport();

      expect(stub.notCalled).to.be.true;
      clock.tick(fullDayInMilliseconds);
      expect(stub.calledOnce).to.be.true;
    });
  });
});
