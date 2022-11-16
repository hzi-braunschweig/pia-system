/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Response } from '@pia/lib-service-core';
import { config } from '../../src/config';
import { Server } from '../../src/server';
import { setup, cleanup } from './internal-personalData.spec.data/setup.helper';
import { PersonalData, PersonalDataReq } from '../../src/models/personalData';
import { mockUpdateAccountMailAddress } from './mockUpdateAccountMailAddress.helper.spec';
import { probandAuthClient } from '../../src/clients/authServerClient';

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress = `http://localhost:${config.internal.port}/personal`;

describe('Internal: /personalData', () => {
  const fetchMock = fetchMocker.sandbox();
  const testSandbox = sinon.createSandbox();

  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /personal/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 200 with the email', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/qtest-proband2/email');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.text).to.equal('test1@example.com');
    });
    it('should return HTTP 404 if no email found for this proband', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/qtest-proband1/email');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });
  });

  describe('PUT /personal/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 200 with created personal data', async () => {
      // Arrange
      mockUpdateAccountMailAddress('qtest-proband1', testSandbox);
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
      });
      const personalData = createPersonalData();

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband1')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.anrede).to.equal('Herr');
      expect(result.body.titel).to.equal('prof');
      expect(result.body.vorname).to.equal('Testvorname1');
      expect(result.body.name).to.equal('Testname1');
    });

    it('should return HTTP 200 with updated personal data', async () => {
      // Arrange
      mockUpdateAccountMailAddress('qtest-proband2', testSandbox);
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
      });
      const personalData = createPersonalData();

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband2')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband2');
      expect(result.body.anrede).to.equal('Herr');
      expect(result.body.titel).to.equal('prof');
      expect(result.body.vorname).to.equal('Testvorname1');
      expect(result.body.name).to.equal('Testname1');
    });

    it('should return HTTP 200 and update account email address', async () => {
      // Arrange
      const authClientUsersStub = mockUpdateAccountMailAddress(
        'qtest-proband2',
        testSandbox
      );
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
      });
      const personalData = createPersonalData();

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband2')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(authClientUsersStub.update).to.have.been.calledWith(
        {
          id: '1234',
          realm: probandAuthClient.realm,
        },
        { email: 'test1@example.com' }
      );
    });

    it('should return HTTP 200 and not update account email address if skipUpdateAccount is true', async () => {
      // Arrange
      const authClientUsersStub = mockUpdateAccountMailAddress(
        'qtest-proband2',
        testSandbox
      );
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
      });
      const personalData = createPersonalData();

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband2?skipUpdateAccount=true')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(authClientUsersStub.update).not.to.have.been.calledWith(
        {
          id: '1234',
          realm: probandAuthClient.realm,
        },
        { email: 'test1@example.com' }
      );
    });

    it('should return HTTP 200 with personal proband data with empty strings as values', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
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
        .put('/personalData/proband/qtest-proband3')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband3');
      expect(result.body.vorname).to.equal('');
      expect(result.body.name).to.equal('');
    });

    it('should return HTTP 200 with personal proband data with null values', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
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
        email: '',
        comment: '',
      };

      // Act
      const result: Response<PersonalData> = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband4')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband4');
      expect(result.body.vorname).to.equal(null);
      expect(result.body.name).to.equal(null);
    });

    it('should return HTTP 400 when a PM tries to create personal data with an invalid postal code', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: true,
        },
      });
      const personalData = createPersonalData();
      personalData.plz = '123abc';

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband5')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 when the proband has refused to be contacted', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          study: 'QTestStudy1',
          complianceContact: false,
        },
      });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/qtest-proband6')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the proband does not exist', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', StatusCodes.NOT_FOUND);
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/DoesNotExist1')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });
  });

  describe('DELETE /personal/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 204 (empty result)', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/personalData/proband/qtest-proband2');
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
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
