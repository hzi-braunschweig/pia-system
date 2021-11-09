/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import fetchMocker from 'fetch-mock';
import { SormasserviceClient } from './sormasserviceClient';
import { config } from '../config';
import * as fetch from 'node-fetch';

chai.use(sinonChai);
const expect = chai.expect;

const fetchMock = fetchMocker.sandbox();
const sandbox: SinonSandbox = createSandbox();
const HTTP_SERVICE_UNAVAILABLE = 503;

describe('sormasserviceClient', function () {
  let isSormasActiveStub: SinonStub;
  beforeEach(() => {
    sandbox
      .stub<typeof fetch, 'default'>(fetch, 'default')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    sandbox
      .stub(config.services.sormasservice, 'url')
      .value('http://sormasservice:5000');
    isSormasActiveStub = sandbox.stub(config, 'isSormasActive');
    fetchMock.catch(HTTP_SERVICE_UNAVAILABLE);
  });
  afterEach(() => {
    sandbox.restore();
    fetchMock.restore();
  });

  describe('getEndDatesForSormasProbands', function () {
    it('should perform a fetch', async () => {
      // Arrange
      isSormasActiveStub.value(true);
      const exampleResponse = [
        { latestFollowUpEndDate: 1597960800000, personUuid: 'ABCDEF' },
      ];
      fetchMock.get('express:/sormas/probands/followUpEndDates/:timestamp', {
        body: exampleResponse,
      });
      const sinceDate = new Date('2020-02-01');

      // Act
      const result = await SormasserviceClient.getEndDatesForSormasProbands(
        sinceDate
      );

      // Assert
      expect(fetchMock.called()).to.be.true;
      expect(result).to.deep.equal(exampleResponse);
    });

    it('should return an empty array if sormasservice is not active', async () => {
      // Arrange
      isSormasActiveStub.value(false);
      const sinceDate = new Date('2020-01-01');

      // Act
      const result = await SormasserviceClient.getEndDatesForSormasProbands(
        sinceDate
      );

      // Assert
      expect(fetchMock.called()).to.be.false;
      expect(result).to.deep.equal([]);
    });
  });
});
