/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import sinon from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
} from '@pia/lib-service-core';
import { config } from '../../src/config';
import { Server } from '../../src/server';
import { cleanup, setup } from './personalData.spec.data/setup.helper';
import { PersonalData, PersonalDataReq } from '../../src/models/personalData';
import { assert } from 'ts-essentials';
import { mockUpdateAccountMailAddress } from './mockUpdateAccountMailAddress.helper.spec';

chai.use(chaiHttp);

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher',
  studies: ['QTestStudy1'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['QTestStudy1'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy1'],
});
const pmHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy3'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/admin/personalData', () => {
  const testSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  beforeEach(() => {
    AuthServerMock.adminRealm().returnValid();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /admin/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband1');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband1')
        .set(probandHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband1')
        .set(forscherHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband1')
        .set(utHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband1')
        .set(sysadminHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pseudonym is missing', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 when a PM tries for pseudonym of study without access', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband2')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when a PM tries for nonexisting personal data', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband3')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with personal proband data when a PM tries ', async () => {
      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
    });

    it('should also accept pseudonyms in uppercase and return HTTP 200', async () => {
      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .get('/admin/personalData/proband/QTest-Proband1')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
    });
  });

  describe('GET /personal/admin/personalData', () => {
    it('should return HTTP 401 when the token is missing', async () => {
      // Act
      const result = await chai.request(apiAddress).get('/admin/personalData');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(probandHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(forscherHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(utHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(sysadminHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with personal proband data when a PM tries ', async () => {
      // Act
      const result: Response<PersonalData[]> = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.lengthOf(1);
      assert(result.body[0]);
      expect(result.body[0].name).to.not.equal(undefined);
      expect(result.body[0].vorname).to.not.equal(undefined);
      expect(result.body[0].pseudonym).to.not.equal(undefined);
    });

    it('should not return personal data of probands the PM has no access to', async () => {
      // Act
      const result: Response<PersonalData[]> = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.lengthOf(1);
      assert(result.body[0]);
      expect(result.body[0].name).to.equal('Testname1');
      expect(result.body[0].vorname).to.equal('Testvorname1');
      expect(result.body[0].pseudonym).to.equal('qtest-proband1');
    });

    it('should return empty result if the PM has no access to probands', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/personalData')
        .set(pmHeader3);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.lengthOf(0);
    });
  });

  describe('PUT /personal/admin/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3')
        .set(probandHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3')
        .set(forscherHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3')
        .set(utHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3')
        .set(sysadminHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pseudonym is missing', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with created personal data', async () => {
      // Arrange
      mockUpdateAccountMailAddress('qtest-proband3', testSandbox);
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: true },
      });
      const personalData = createPersonalData();

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband3');
      expect(result.body.anrede).to.equal('Herr');
      expect(result.body.titel).to.equal('prof');
      expect(result.body.vorname).to.equal('Testvorname1');
      expect(result.body.name).to.equal('Testname1');
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband', async () => {
      // Arrange
      mockUpdateAccountMailAddress('qtest-proband1', testSandbox);
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: true },
      });
      const personalData = {
        anrede: 'Frau',
        titel: 'doc',
        name: 'Testname1_updated',
        vorname: 'Testvorname1_updated',
        strasse: 'Teststr.',
        haus_nr: '666',
        plz: '66666',
        landkreis: 'NRW',
        ort: 'Bonn',
        telefon_privat: '1234567',
        telefon_dienst: '7654321',
        telefon_mobil: '01559876543',
        email: 'test1@example.com',
        comment: 'Proband hat neue Adresse',
      };

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.anrede).to.equal('Frau');
      expect(result.body.titel).to.equal('doc');
      expect(result.body.vorname).to.equal('Testvorname1_updated');
      expect(result.body.name).to.equal('Testname1_updated');
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband with empty strings as values', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: true },
      });
      const personalData = {
        anrede: '',
        titel: '',
        name: '',
        vorname: '',
        strasse: '',
        haus_nr: '',
        plz: '',
        landkreis: '',
        ort: '',
        telefon_privat: '',
        telefon_dienst: '',
        telefon_mobil: '',
        email: '',
        comment: '',
      };

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.vorname).to.equal('');
      expect(result.body.name).to.equal('');
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband with null values', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: true },
      });
      const personalData = {
        anrede: '',
        titel: '',
        name: null,
        vorname: null,
        strasse: '',
        haus_nr: '',
        plz: '',
        landkreis: '',
        ort: '',
        telefon_privat: null,
        telefon_dienst: null,
        telefon_mobil: '',
        email: null,
        comment: '',
      };

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.vorname).to.equal(null);
      expect(result.body.name).to.equal(null);
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband with a valid postal code', async () => {
      // Arrange
      mockUpdateAccountMailAddress('qtest-proband1', testSandbox);
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: true },
      });
      const personalData = { ...createPersonalData(), plz: '0123' };

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.plz).to.equal('0123');
    });

    it('should return HTTP 400 when a PM tries to update proband with an invalid postal code', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: true },
      });

      // Act
      const probandUpdate = { ...createPersonalData(), plz: '012ab3' };
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader)
        .send(probandUpdate);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 when the proband has refused to be contacted', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy1', complianceContact: false },
      });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when the PM has no access to the probands data', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'QTestStudy3', complianceContact: true },
      });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/admin/personalData/proband/qtest-proband3')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  function createPersonalData(): PersonalDataReq {
    return {
      anrede: 'Herr',
      titel: 'prof',
      name: 'Testname1',
      vorname: 'Testvorname1',
      strasse: 'Teststr.',
      haus_nr: '666',
      plz: '66666',
      landkreis: 'NRW',
      ort: 'Bonn',
      telefon_privat: '1234567',
      telefon_dienst: '7654321',
      telefon_mobil: '01559876543',
      email: 'test1@example.com',
      comment: 'Proband hat neue Adresse',
    };
  }
});
