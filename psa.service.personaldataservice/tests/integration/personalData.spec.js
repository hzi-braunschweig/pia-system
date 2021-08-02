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

const { setup, cleanup } = require('./personalData.spec.data/setup.helper');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const server = require('../../src/server');

const testSandbox = sinon.createSandbox();

const JWT = require('jsonwebtoken');

const apiAddress = 'http://localhost:' + process.env.PORT + '/personal';

const probandSession = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudy1'],
};
const forscherSession = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher',
  groups: ['QTestStudy1'],
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['QTestStudy1'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
  groups: [],
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudy1'],
};
const pmSession3 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudy3'],
};

function sign(session) {
  return JWT.sign(session, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  });
}

const invalidHeader = {
  authorization: JWT.sign(probandSession, 'thisIsNotAValidPrivateKey', {
    expiresIn: '24h',
  }),
};
const probandHeader = { authorization: sign(probandSession) };
const forscherHeader = { authorization: sign(forscherSession) };
const utHeader = { authorization: sign(utSession) };
const sysadminHeader = { authorization: sign(sysadminSession) };
const pmHeader = { authorization: sign(pmSession) };
const pmHeader3 = { authorization: sign(pmSession3) };

describe('/personalData', () => {
  before(async function () {
    await setup();
    await server.init();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  beforeEach(async () => {
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock.catch(503);
  });

  afterEach(async () => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /personal/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 401 when the token is wrong', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1')
        .set(invalidHeader);

      // Assert
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1');

      // Assert
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1')
        .set(probandHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1')
        .set(forscherHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1')
        .set(utHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries tries', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1')
        .set(sysadminHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 404 when the pseudonym is missing', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 404 when a PM tries for pseudonym of study without access', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband2')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 404 when a PM tries for nonexisting personal data', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband3')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 200 with personal proband data when a PM tries ', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData/proband/QTestProband1')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestProband1');
    });
  });

  describe('GET /personal/personalData', () => {
    it('should return HTTP 401 when the token is wrong', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(invalidHeader);

      // Assert
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 401 when the token is missing', async () => {
      // Act
      const result = await chai.request(apiAddress).get('/personalData');

      // Assert
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(probandHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(forscherHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(utHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries tries', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(sysadminHeader);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 200 with personal proband data when a PM tries ', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body).to.have.lengthOf(1);
      expect(result.body[0].name).to.not.equal(undefined);
      expect(result.body[0].vorname).to.not.equal(undefined);
      expect(result.body[0].pseudonym).to.not.equal(undefined);
    });

    it('should not return personal data of probands the PM has no access to', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(pmHeader);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body).to.have.lengthOf(1);
      expect(result.body[0].name).to.equal('Testname1');
      expect(result.body[0].vorname).to.equal('Testvorname1');
      expect(result.body[0].pseudonym).to.equal('QTestProband1');
    });

    it('should return empty result if the PM has no access to probands', async () => {
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/personalData')
        .set(pmHeader3);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body).to.have.lengthOf(0);
    });
  });

  describe('PUT /personal/personalData/proband/{pseudonym}', () => {
    it('should return HTTP 401 when the token is wrong', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(invalidHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3');

      // Assert
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(probandHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(forscherHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(utHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(sysadminHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 404 when the pseudonym is missing', async () => {
      // Arrange
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 200 with created personal data', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
        });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestProband3');
      expect(result.body.anrede).to.equal('Herr');
      expect(result.body.titel).to.equal('prof');
      expect(result.body.vorname).to.equal('Testvorname1');
      expect(result.body.name).to.equal('Testname1');
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
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
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestProband1');
      expect(result.body.anrede).to.equal('Frau');
      expect(result.body.titel).to.equal('doc');
      expect(result.body.vorname).to.equal('Testvorname1_updated');
      expect(result.body.name).to.equal('Testname1_updated');
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband with empty strings as values', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
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
        .put('/personalData/proband/QTestProband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestProband1');
      expect(result.body.vorname).to.equal('');
      expect(result.body.name).to.equal('');
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband with null values', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
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
        .put('/personalData/proband/QTestProband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.pseudonym).to.equal('QTestProband1');
      expect(result.body.vorname).to.equal(null);
      expect(result.body.name).to.equal(null);
    });

    it('should return HTTP 200 with personal proband data when a PM tries to update proband with a valid postal code', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
        });
      const personalData = { ...createPersonalData(), plz: '0123' };

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body.plz).to.equal('0123');
    });

    it('should return HTTP 400 when a PM tries to update proband with an invalid postal code', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
        });

      // Act
      const probandUpdate = { ...createPersonalData(), plz: '012ab3' };
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband1')
        .set(pmHeader)
        .send(probandUpdate);

      // Assert
      expect(result, result.text).to.have.status(400);
    });

    it('should return HTTP 404 when the proband was deactivated', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy1' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'deactivated' },
        });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband1')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 404 when the PM has no access to the probands data', async () => {
      // Arrange
      fetchMock
        .get('express:/user/users/:pseudonym/primaryStudy', {
          body: { name: 'QTestStudy3' },
        })
        .get('express:/user/users/:pseudonym', {
          body: { account_status: 'active' },
        });
      const personalData = createPersonalData();

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/personalData/proband/QTestProband3')
        .set(pmHeader)
        .send(personalData);

      // Assert
      expect(result, result.text).to.have.status(404);
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
