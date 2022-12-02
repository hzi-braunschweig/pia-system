/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './export.spec.data/setup.helper';
import sinon from 'sinon';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['QTestStudy2'],
});
const probandHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband3',
  studies: ['QTestStudy3'],
});
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTestStudy3', 'QTestStudy1'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['QTestStudy1'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy1'],
});

const studyContact =
  'Studienzentrum des QTestStudy1 für Infektionsforschung<br> QTestStudy1<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: QTestStudy1@QTestStudy1.de';
const studyWelcomeText =
  '# Welcome to our study! We are happy to have you with us!';
const sanitizedText = 'Welcome <img src="x"> home !';

describe('/studies', function () {
  const sandbox = sinon.createSandbox();

  before(async function () {
    await Server.init();
  });

  after(async function () {
    sandbox.restore();

    await Server.stop();
  });

  beforeEach(() => {
    AuthServerMock.probandRealm().returnValid();
  });

  afterEach(AuthServerMock.cleanAll);

  describe('GET /studies/{studyName}', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 403 if the Proband has no access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct study for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({
        name: 'QTestStudy1',
        sample_prefix: 'TESTPREFIX',
        sample_suffix_length: 5,
        has_rna_samples: false,
        has_partial_opposition: true,
        links: { self: { href: '/studies/QTestStudy1' } },
      });
    });
  });

  describe('GET /studies/addresses', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 403 if the Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the Probandenmanager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct study for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.length).to.equal(1);
      expect(result.body[0].address).to.equal(studyContact);
      expect(result.body[0].name).to.equal('QTestStudy1');
    });
  });

  describe('GET /studies/{studyName}/welcome-text', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 200 if Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1/welcome-text')
        .set(probandHeader1)
        .send();
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.welcome_text).equal(studyWelcomeText);
    });

    it('should return HTTP 403 if Proband tries and has no access study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy2/welcome-text')
        .set(probandHeader1)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with sanitized welcome text', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy2/welcome-text')
        .set(probandHeader2)
        .send();
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.welcome_text).equal(sanitizedText);
    });

    it('should return HTTP 204 and empty response if the study welcome text does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy3/welcome-text')
        .set(probandHeader3)
        .send();
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(result.body).to.be.empty;
    });
  });
});
