/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');
const fetchMock = require('fetch-mock').sandbox();
const fetch = require('node-fetch');

const {
  setup,
  cleanup,
} = require('./internal-personalData.spec.data/setup.helper');

const server = require('../../src/server');
const testSandbox = sinon.createSandbox();

const apiAddress =
  'http://localhost:' + process.env.INTERNAL_PORT + '/personal';

describe('Internal: /personalData', () => {
  before(async function () {
    await setup();
    await server.init();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  beforeEach(() => {
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock.catch(503);
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
        .get('/personalData/proband/QTestproband2/email');

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.text).to.equal('test1@example.com');
    });
    it('should return HTTP 404 if no email found for this proband', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestproband1/email');

      // Assert
      expect(result, result.text).to.have.status(404);
    });
  });

  describe('PUT /personal/personalData/proband/{pseudonym}', () => {
    beforeEach(() => {
      fetchMock.get('express:/user/users/:pseudonym/primaryStudy', {
        body: {
          name: 'QTestStudy1',
        },
      });
    });

    it('should return HTTP 200 with created personal data', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          account_status: 'active',
        },
      });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestproband1')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestproband1');
      expect(result.body.anrede).to.equal('Herr');
      expect(result.body.titel).to.equal('prof');
      expect(result.body.vorname).to.equal('Testvorname1');
      expect(result.body.name).to.equal('Testname1');
    });

    it('should return HTTP 200 with updated personal data', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          account_status: 'active',
        },
      });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestproband2')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestproband2');
      expect(result.body.anrede).to.equal('Herr');
      expect(result.body.titel).to.equal('prof');
      expect(result.body.vorname).to.equal('Testvorname1');
      expect(result.body.name).to.equal('Testname1');
    });

    it('should return HTTP 200 with personal proband data with empty strings as values', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          account_status: 'active',
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
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestproband3')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestproband3');
      expect(result.body.vorname).to.equal('');
      expect(result.body.name).to.equal('');
    });

    it('should return HTTP 200 with personal proband data with null values', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          account_status: 'active',
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
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestproband4')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestproband4');
      expect(result.body.vorname).to.equal(null);
      expect(result.body.name).to.equal(null);
    });

    it('should return HTTP 400 when a PM tries to create personal data with an invalid postal code', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          account_status: 'active',
        },
      });
      const personalData = createPersonalData();
      personalData.plz = '123abc';

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestproband5')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(400);
    });

    it('should return HTTP 404 when the proband was deactivated', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', {
        body: {
          account_status: 'deactivated',
        },
      });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestproband6')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 404 when the proband does not exist', async () => {
      // Arrange
      fetchMock.get('express:/user/users/:pseudonym', 404);
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/DoesNotExist1')
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(404);
    });
  });

  describe('DELETE /personal/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 204 (empty result)', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/personalData/proband/QTestproband2');
      expect(result, result.text).to.have.status(204);
    });
  });

  function createPersonalData() {
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
