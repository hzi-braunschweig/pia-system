/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from './serviceClient';
import { StatusCodes } from 'http-status-codes';
import { expect } from 'chai';
import { createSandbox } from 'sinon';
import fetchMocker from 'fetch-mock';
import { HttpClient } from './httpClient';

class TestserviceClient extends ServiceClient {}

const testSandbox = createSandbox();

describe('ServiceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let client: TestserviceClient;

  beforeEach(() => {
    client = new TestserviceClient('http://testservice:5000');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('waitForService', () => {
    it('should return as soon as service is available', async () => {
      // Arrange
      let callCount = 0;
      const expectedCallCount = 6;
      const triesBeforeAvailable = 5;
      const retryCount = 10;
      const delay = 30;
      fetchMock.get(
        {
          url: 'http://testservice:5000',
        },
        () => {
          ++callCount;
          if (callCount <= triesBeforeAvailable) {
            return { throws: new Error('Service unavailable') };
          } else {
            return StatusCodes.OK;
          }
        }
      );

      // Act
      await client.waitForService(retryCount, delay);

      // Assert
      expect(
        fetchMock.called('http://testservice:5000', {
          method: 'GET',
        })
      ).to.be.true;
      expect(callCount).to.eql(expectedCallCount);
    });

    it('should return error if service is not becoming available', async () => {
      // Arrange
      const retryCount = 5;
      const delay = 30;
      fetchMock.get(
        {
          url: 'http://testservice:5000',
        },
        { throws: new Error('Service unavailable') }
      );

      try {
        // Act
        await client.waitForService(retryCount, delay);
      } catch (err) {
        // Assert
        if (err instanceof Error) {
          expect(err.message).to.eql(
            'http://testservice:5000: Could not reach service after 5 retries'
          );
        } else {
          expect('is unexpected error message').to.be.false;
        }
      }
    });

    it('should throw if retry count is too low', async () => {
      try {
        // Act
        await client.waitForService(0, 1);
      } catch (err) {
        // Assert
        if (err instanceof Error) {
          expect(err.message).to.eql('retryCount must be greater than 0');
        } else {
          expect('is unexpected error message').to.be.false;
        }
      }
    });
  });
});
