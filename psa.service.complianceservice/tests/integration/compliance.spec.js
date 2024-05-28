/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
chai.use(chaiHttp);
chai.use(chaiExclude);
const expect = chai.expect;
const sinon = require('sinon');
const fetchMocker = require('fetch-mock');

const { HttpClient } = require('@pia-system/lib-http-clients-internal');
const { config } = require('../../src/config');
const { Server } = require('../../src/server');
const { sequelize, ComplianceText, Compliance } = require('../../src/db');

const {
  AuthTokenMockBuilder,
  AuthServerMock,
} = require('@pia/lib-service-core');

const testSandbox = sinon.createSandbox();

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTeststudie1'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['QTeststudie33'],
});
const researchTeamHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'researchteam1',
  studies: ['QTeststudie1', 'QTeststudie2'],
});

const fetchMock = fetchMocker.sandbox();

describe('Compliance API', () => {
  before(async () => {
    await sequelize.sync();
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await ComplianceText.destroy({ truncate: true, cascade: true });
    await Compliance.destroy({ truncate: true, cascade: true });

    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);

    fetchMock
      .get('express:/user/users/qtest-proband1/externalcompliance', {
        body: JSON.stringify({
          complianceSamples: true,
          complianceBloodsamples: true,
          complianceLabresults: true,
        }),
      })
      .get('express:/user/users/qtest-proband1/mappingId', {
        body: 'e959c22a-ab73-4b70-8871-48c23080b87b',
      })
      .catch(503);
  });

  afterEach(async () => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /{studyName}/agree/{pseudonym}/needed', () => {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return http 200 and false if no text exists', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/qtest-proband1/needed')
        .set(probandHeader);

      expect(res).to.have.status(200);
      expect(res.body).to.be.false;
    });

    it('should return http 200 and true if text exists', async () => {
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/qtest-proband1/needed')
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.true;
    });

    it('should also accept pseudonyms in uppercase and return http 200', async () => {
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/QTest-Proband1/needed')
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.true;
    });

    it('should return http 200 and false if text and compliance exist', async () => {
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      await Compliance.create(compl2);
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/qtest-proband1/needed')
        .set(probandHeader);

      expect(res).to.have.status(200);
      expect(res.body).to.be.false;
    });
  });

  describe('GET /{studyName}/agree/{pseudonym}', () => {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return http 200 and the external compliance', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/qtest-proband1')
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body.compliance_system).to.deep.equal({
        app: true,
        bloodsamples: true,
        labresults: true,
        samples: true,
      });
    });

    it('should return http 200 and the internal compliance', async () => {
      // Arrange
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      await Compliance.create(compl2);

      // Act
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/qtest-proband1')
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(compl2_res);
    });

    it('should also accept pseudonyms in upper case and return http 200', async () => {
      // Arrange
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      await Compliance.create(compl2);

      // Act
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree/QTest-Proband1')
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
    });
  });

  describe('GET /admin/{studyName}/agree/{pseudonym}', () => {
    it('should return http 200 only with compliance text and timestamp', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Untersuchungsteam',
      });
      await Compliance.create(compl2);

      // Act
      const res = await chai
        .request(apiAddress)
        .get('/admin/QTeststudie1/agree/qtest-proband1')
        .set(researchTeamHeader);

      // Assert
      authRequest.isDone();
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({
        compliance_text: compl2_res.compliance_text,
        compliance_text_object: compl2_res.compliance_text_object,
        compliance_system: null,
        textfields: null,
        compliance_questionnaire: null,
        timestamp: compl2_res.timestamp,
      });
    });

    it('should also accept pseudonyms in upper case and return http 200', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Untersuchungsteam',
      });
      await Compliance.create(compl2);

      // Act
      const res = await chai
        .request(apiAddress)
        .get('/admin/QTeststudie1/agree/QTest-Proband1')
        .set(researchTeamHeader);

      // Assert
      authRequest.isDone();
      expect(res).to.have.status(200);
    });
  });

  describe('POST /{studyName}/agree/{pseudonym}', () => {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return http 403 if the request username is not matching the compliance username', async () => {
      // Act
      const res = await chai
        .request(apiAddress)
        .post('/QTeststudie1/agree/qtest-proband2')
        .set(probandHeader)
        .send(compl2_req);

      // Assert
      expect(res).to.have.status(403);
    });

    it('should return 403 if an unauthorized proband tries', async () => {
      // Act
      const res = await chai
        .request(apiAddress)
        .post('/QTeststudie1/agree/qtest-proband2')
        .set(probandHeader2)
        .send(compl2_req);

      // Assert
      expect(res).to.have.status(403);
    });

    describe('Preconditions: no compliance needed', () => {
      it('should return http 409 if no compliance_text exists at all', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send(compl2_req);

        // Assert
        expect(res).to.have.status(409);
      });

      it('should return http 409 if both compliance_text and compliance exist', async () => {
        // Arrange
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
        await Compliance.create(compl2);

        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send(compl2_req);

        // Assert
        expect(res).to.have.status(409);
      });
    });

    describe('Preconditions: compliance needed', () => {
      beforeEach(async () => {
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
      });

      it('should return http 200 and create', async () => {
        // Arrange
        const now = Date.now();

        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send(compl2_req);

        // Assert
        expect(res).to.have.status(200);
        expect(res.body).to.haveOwnProperty('timestamp');
        expect(res.body).excluding('timestamp').to.deep.equal(compl2_res);
        const complDb = await Compliance.findOne({
          where: {
            mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
            study: 'QTeststudie1',
          },
        });
        expect(new Date(complDb.timestamp).getTime()).to.be.greaterThan(
          now - 1
        );
        expect(complDb.complianceText).to.equal(compl2.complianceText);
      });

      it('should also accept uppercase pseudonyms and return http 200', async () => {
        // Arrange
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/QTest-Proband1')
          .set(probandHeader)
          .send(compl2_req);

        // Assert
        expect(res).to.have.status(200);
      });

      it('should return http 400 if request is empty', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send();

        // Assert
        expect(res).to.have.status(400);
      });

      it('should return http 400 if request is an empty object', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send({});

        // Assert
        expect(res).to.have.status(400);
      });

      it('should return http 400 if an empty text is given', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send({
            compliance_text: '',
          });

        // Assert
        expect(res).to.have.status(400);
      });

      it('should return http 422 if a text is given but no app compliance', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
          });

        // Assert
        expect(res).to.have.status(422);
      });

      it('should return http 422 if no app compliance', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
            compliance_system: {},
          });

        // Assert
        expect(res).to.have.status(422);
      });

      it('should return http 422 if app compliance is false', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
            compliance_system: {
              app: false,
            },
          });

        // Assert
        expect(res).to.have.status(422);
      });

      it('should return http 200 if app compliance is true', async () => {
        // Act
        const res = await chai
          .request(apiAddress)
          .post('/QTeststudie1/agree/qtest-proband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
            compliance_system: {
              app: true,
            },
            textfields: {
              firstname: 'Jack',
            },
          });

        // Assert
        expect(res).to.have.status(200);
      });
    });
  });

  describe('POST /admin/{studyName}/agree/{userId}', () => {
    describe('Preconditions: compliance needed', () => {
      beforeEach(async () => {
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
      });

      it('should return http 200 and create', async () => {
        const authRequest = AuthServerMock.adminRealm().returnValid();
        const now = Date.now();
        const res = await chai
          .request(apiAddress)
          .post('/admin/QTeststudie1/agree/qtest-proband1')
          .set(researchTeamHeader)
          .send(compl2_req);

        authRequest.done();
        expect(res).to.have.status(200);
        expect(res.body).to.haveOwnProperty('timestamp');
        expect(res.body).excluding('timestamp').to.deep.equal(compl2_res);
        const complDb = await Compliance.findOne({
          where: {
            mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
            study: 'QTeststudie1',
          },
        });
        expect(new Date(complDb.timestamp).getTime()).to.be.greaterThan(
          now - 1
        );
        expect(complDb.complianceText).to.equal(compl2.complianceText);
      });
    });
  });

  const compl2 = {
    mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
    study: 'QTeststudie1',
    timestamp: new Date('2020-05-29T10:17:02.000Z'),
    complianceText: 'newest',
    username: null,
    ids: null,
    firstname: 'Test',
    lastname: 'Proband',
    location: null,
    birthdate: '1972-06-22',
    complianceApp: true,
    complianceBloodsamples: true,
    complianceLabresults: false,
    complianceSamples: false,
  };

  const compl2_req = {
    compliance_text: 'newest',
    compliance_system: {
      app: true,
      bloodsamples: true,
      labresults: false,
      samples: false,
    },
    textfields: {
      birthdate: '1972-06-22',
      firstname: 'Test',
      lastname: 'Proband',
    },
    compliance_questionnaire: [],
  };

  const compl2_res = {
    compliance_text: 'newest',
    compliance_text_object: [
      {
        html: '<p>newest</p>',
        type: 'HTML',
      },
    ],
    compliance_system: {
      app: true,
      bloodsamples: true,
      labresults: false,
      samples: false,
    },
    textfields: {
      birthdate: '1972-06-22',
      firstname: 'Test',
      lastname: 'Proband',
      location: null,
    },
    compliance_questionnaire: [],
    timestamp: '2020-05-29T10:17:02.000Z',
  };
});
