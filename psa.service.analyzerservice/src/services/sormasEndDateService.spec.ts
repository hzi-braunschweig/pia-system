/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox, SinonStub } from 'sinon';
import chai from 'chai';
import { SormasserviceClient } from '../clients/sormasserviceClient';
import { SormasEndDateService } from './sormasEndDateService';

const expect = chai.expect;
const sandbox = createSandbox();

describe('SormasEndDateService', () => {
  let sormasClientStub: SinonStub;

  before(() => {
    sormasClientStub = sandbox.stub(
      SormasserviceClient,
      'getEndDatesForSormasProbands'
    );
    sormasClientStub.resolves([
      { latestFollowUpEndDate: 1597960800000, personUuid: 'ABCDEF' },
    ]);
  });

  describe('getEndDateForUUID', () => {
    beforeEach(() => {
      sormasClientStub.resetHistory();
    });

    it('should fill the cache with data from sormas client and return data', async () => {
      const uuid = 'ABCDEF';
      const result = await SormasEndDateService.getEndDateForUUID(uuid);

      expect(sormasClientStub.calledOnce).to.be.true;
      expect(result!.toISOString()).to.equal('2020-08-20T22:00:00.000Z');
    });

    it('should return cached data', async () => {
      const uuid = 'ABCDEF';
      const result = await SormasEndDateService.getEndDateForUUID(uuid);

      expect(sormasClientStub.notCalled).to.be.true;
      expect(result!.toISOString()).to.equal('2020-08-20T22:00:00.000Z');
    });

    it('should return undefined if uuid was not found', async () => {
      const uuid = 'DoNotExist';
      const result = await SormasEndDateService.getEndDateForUUID(uuid);

      expect(result).to.be.undefined;
    });
  });
});
