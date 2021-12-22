/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-non-null-assertion */

import { StatusCodes } from 'http-status-codes';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createSandbox } from 'sinon';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import fetchMocker from 'fetch-mock';

import { config } from '../config';
import { SormasClient } from './sormasClient';
import { SymptomsDto } from '../models/symptomsDto';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('SormasClient', function () {
  const fetchMock = fetchMocker.sandbox();

  beforeEach(() => {
    testSandbox
      .stub(config.sormas, 'url')
      .value('https://sb.sormas.netzlink.com');
    testSandbox.stub(config.sormas, 'username').value('derUser');
    testSandbox.stub(config.sormas, 'password').value('dasPasswort');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('uploadVisit', function () {
    it('should perform a fetch with meaningful data', async () => {
      // Arrange
      fetchMock.post('express:/sormas-rest/visits-external/', {
        body: ['OK'],
      });
      const sormasData: SymptomsDto = { symptomsComments: 'value' };

      // Act
      await SormasClient.uploadVisit('ABCDEF', new Date(), 1, sormasData);

      // Assert
      expect(fetchMock.called(fetchMock.MATCHED)).to.be.true;
      const args = fetchMock.lastCall(fetchMock.MATCHED)!;
      expect(args[1]).to.be.an('object');
      const body = JSON.parse(args[1]!.body as string);
      expect(body[0]!.personUuid).to.equal('ABCDEF');
      expect(body[0]!.disease).to.equal('CORONAVIRUS');
      expect(body[0]!.visitStatus).not.to.be.undefined;
      expect(body[0]!.symptoms).to.eql(sormasData);
    });
  });

  describe('getApiVersion', () => {
    it('should fetch the api version', async () => {
      // Arrange
      fetchMock.get('express:/sormas-rest/visits-external/version', {
        body: '"1.41.0"',
      });

      // Act
      const version = await SormasClient.getApiVersion();

      // Assert
      expect(version).to.equal('1.41.0');
    });

    it('should return null if API is unavailable', async () => {
      // Arrange
      fetchMock.get(
        'express:/sormas-rest/visits-external/version',
        StatusCodes.SERVICE_UNAVAILABLE
      );

      // Act
      const version = SormasClient.getApiVersion();

      // Assert
      await expect(version).to.eventually.be.rejected;
    });
  });

  describe('setStatus', () => {
    it('should post a users status', async () => {
      // Arrange
      fetchMock.post(
        'express:/sormas-rest/visits-external/person/ABCD-EFGH/status',
        {
          body: true,
        }
      );

      // Act
      await SormasClient.setStatus('ABCD-EFGH', 'REGISTERED');

      // Assert
      expect(fetchMock.called(fetchMock.MATCHED)).to.be.true;
      const args = fetchMock.lastCall()!;
      expect(args[1]!).to.be.an('object');
      expect(args[1]!.method).to.equal('POST');
      const body = JSON.parse(args[1]!.body as string);
      expect(body).to.be.an('object');
      expect(body.status).to.equal('REGISTERED');
    });

    it('should return throw an error if API returned "false"', async () => {
      // Arrange
      fetchMock.post(
        'express:/sormas-rest/visits-external/person/ABCD-EFGH/status',
        {
          body: false,
        }
      );
      const response = SormasClient.setStatus('ABCD-EFGH', 'REGISTERED');

      // Act
      // Assert
      await expect(response).to.eventually.be.rejected;
    });
  });
});
