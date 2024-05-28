/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { UserFileResponse } from '../../src/models/userFile';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './images.spec.data/setup.helper';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studie-proband1',
  studies: ['ApiTestStudie'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studi2-proband',
  studies: ['ApiTestStudi2'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestStudie', 'ApiTestMultiProfs'],
});
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher2',
  studies: ['ApiTestStudi2', 'ApiTestStudi4', 'ApiTestMultiProfs'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['ApiTestMultiProfs', 'ApiTestStudi2', 'ApiTestStudie'],
});
const utHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam2',
  studies: ['ApiTestStudi2', 'ApiTestMultiProfs'],
});

describe('/files', function () {
  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  afterEach(AuthServerMock.cleanAll);

  const clockImageAsBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC';

  describe('GET /admin/files/{id}', function () {
    beforeEach(() => AuthServerMock.adminRealm().returnValid());

    it('should return HTTP 403 if forscher has no study access', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/files/99996')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if UT tries for instances that is for proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/files/99996')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if UT tries for instances that is for UT but wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/files/7777771')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and image id for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/files/99996')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.property('file');
      expect(result.body).to.have.property('file_name');
      expect((result.body as UserFileResponse).file).to.equal(
        clockImageAsBase64
      );
    });

    it('should return HTTP 200 and image id for UT if the instance is for UT and the study matches', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/files/7777771')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.property('file');
      expect((result.body as UserFileResponse).file).to.equal(
        clockImageAsBase64
      );
    });
  });

  describe('GET /files/{id}', function () {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());

    it('should return HTTP 200 and image id for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.property('file');
      expect(result.body).to.have.property('file_name');
      expect((result.body as UserFileResponse).file).to.equal(
        clockImageAsBase64
      );
    });

    it('should have name "clock.svg"', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader1);
      expect((result.body as UserFileResponse).file_name).to.equal('clock.svg');
    });

    it('should return HTTP 403 if image does not belong to user ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if image does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/999')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
});
