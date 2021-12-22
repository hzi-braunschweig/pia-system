/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createSandbox } from 'sinon';

import { HttpClient } from '../core/httpClient';
import { ComplianceserviceClient } from './complianceserviceClient';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('ComplianceserviceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let client: ComplianceserviceClient;

  beforeEach(() => {
    client = new ComplianceserviceClient('http://complianceservice:5000');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('hasAgreedToCompliance', () => {
    it('should call complianceservice to check whether one compliance has been agreed', async () => {
      // Arrange
      const pseudonym = 'TEST-1234';
      fetchMock.get(
        {
          url: 'express:/compliance/:study/agree/:pseudonym',
          query: { system: 'somestring' },
        },
        {
          status: StatusCodes.OK,
          body: true,
        }
      );

      const result = await client.hasAgreedToCompliance(
        pseudonym,
        'Teststudy',
        'somestring'
      );

      // Assert
      expect(
        fetchMock.called('express:/compliance/:study/agree/:pseudonym', {
          method: 'GET',
          query: { system: 'somestring' },
        })
      ).to.be.true;
      expect(result).to.be.true;
    });

    it('should call complianceservice to check whether multiple compliances have been agreed', async () => {
      // Arrange
      const pseudonym = 'TEST-1234';
      fetchMock.get(
        {
          url: 'express:/compliance/:study/agree/:pseudonym',
          query: { 'system[]': ['some', 'string'] },
        },
        {
          status: StatusCodes.OK,
          body: true,
        }
      );

      const result = await client.hasAgreedToCompliance(
        pseudonym,
        'Teststudy',
        ['some', 'string']
      );

      // Assert
      expect(
        fetchMock.called('express:/compliance/:study/agree/:pseudonym', {
          method: 'GET',
          query: { 'system[]': ['some', 'string'] },
        })
      ).to.be.true;
      expect(result).to.be.true;
    });
  });
});
