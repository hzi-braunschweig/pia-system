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
import { LoggingserviceClient } from './loggingserviceClient';
import {
  SystemLogInternalDto,
  SystemLogRequestInternalDto,
} from '../dtos/systemLog';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('LoggingserviceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let client: LoggingserviceClient;

  beforeEach(() => {
    client = new LoggingserviceClient('http://loggingservice:5000');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('createSystemLog', () => {
    it('should call loggingservice to create a system log', async () => {
      // Arrange
      fetchMock.post(
        {
          url: 'express:/log/systemLogs',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(createSystemLog()),
        }
      );

      const result = await client.createSystemLog(createSystemLogRequest());

      // Assert
      expect(
        fetchMock.called('express:/log/systemLogs', {
          method: 'POST',
          body: createSystemLogRequest(),
        })
      ).to.be.true;
      expect(result).to.deep.eq(createSystemLog());
    });
  });

  function createSystemLogRequest(): SystemLogRequestInternalDto {
    return {
      requestedBy: 'someforscher',
      requestedFor: 'someotherforscher',
      type: 'proband',
    };
  }

  function createSystemLog(): SystemLogInternalDto {
    return {
      requestedBy: 'someforscher',
      requestedFor: 'someotherforscher',
      timestamp: '2021-10-22T17:54:44.419Z',
      type: 'proband',
    };
  }
});
