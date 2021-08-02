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

const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const server = require('../../src/server');
const { sequelize, ComplianceText, Compliance } = require('../../src/db');

const apiAddress = 'http://localhost:' + process.env.PORT;

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');

const { config } = require('../../src/config');
const userserviceUrl = config.services.userservice.url;

const probandSession = {
  id: 1,
  role: 'Proband',
  username: 'QTestproband1',
  groups: ['QTeststudie1', 'QTeststudie2'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestproband2',
  groups: ['QTeststudie33', 'QTeststudie55'],
};
const researchTeam = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'researchteam1',
  groups: ['QTeststudie1', 'QTeststudie2'],
};

const probandToken = JWT.sign(probandSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const researchTeamToken = JWT.sign(researchTeam, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const probandHeader = { authorization: probandToken };
const probandHeader2 = { authorization: probandToken2 };
const researchTeamHeader = { authorization: researchTeamToken };

describe('Compliance API', () => {
  before(async () => {
    await sequelize.sync();
    await server.init();
  });

  after(async () => {
    await server.stop();
  });

  beforeEach(async () => {
    await ComplianceText.destroy({ truncate: true, cascade: true });
    await Compliance.destroy({ truncate: true, cascade: true });

    testSandbox.stub(fetch, 'default').callsFake(async (url) => {
      if (
        url ===
        userserviceUrl + '/user/users/QTestproband1/externalcompliance'
      ) {
        return new fetch.Response(
          JSON.stringify({
            compliance_samples: true,
            compliance_bloodsamples: true,
            compliance_labresults: true,
          })
        );
      } else if (
        url ===
        userserviceUrl + '/user/users/QTestproband1/mappingId'
      ) {
        return new fetch.Response('e959c22a-ab73-4b70-8871-48c23080b87b');
      } else {
        return new fetch.Response(null, { status: 503 });
      }
    });
  });
  afterEach(async () => {
    testSandbox.restore();
  });

  describe('GET /compliance/{study}/agree/{userId}/needed', () => {
    it('should return http 200 and false if no text exists', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1/needed')
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
        .get('/compliance/QTeststudie1/agree/QTestproband1/needed')
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
        .get('/compliance/QTeststudie1/agree/QTestproband1/needed')
        .set(probandHeader);

      expect(res).to.have.status(200);
      expect(res.body).to.be.false;
    });
  });

  describe('GET /compliance/{study}/agree/{userId}', () => {
    it('should return http 200 and the external compliance', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
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
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      await Compliance.create(compl2);
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
        .set(probandHeader);

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(compl2_res);
    });

    it('should return http 200 only with compliance text and timestamp', async () => {
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Untersuchungsteam',
      });
      await Compliance.create(compl2);
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
        .set(researchTeamHeader);

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
  });

  describe('POST /compliance/{study}/agree/{userId}', () => {
    it('should return http 403 if the request username is not matching the compliance username', async () => {
      const res = await chai
        .request(apiAddress)
        .post('/compliance/QTeststudie1/agree/QTestproband2')
        .set(probandHeader)
        .send(compl2_req);

      // Assert
      expect(res).to.have.status(403);
    });

    it('should return 401 if an unauthorized proband tires', async () => {
      const res = await chai
        .request(apiAddress)
        .post('/compliance/QTeststudie1/agree/QTestproband2')
        .set(probandHeader2)
        .send(compl2_req);

      // Assert
      expect(res).to.have.status(401);
    });

    describe('Preconditions: no compliance needed', () => {
      it('should return http 409 if no compliance_text exists at all', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send(compl2_req);

        // Assert
        expect(res).to.have.status(409);
      });

      it('should return http 409 if both compliance_text and compliance exist', async () => {
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
        await Compliance.create(compl2);
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send(compl2_req);

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
        const now = Date.now();
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send(compl2_req);

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

      it('should return http 200 and create', async () => {
        const now = Date.now();
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(researchTeamHeader)
          .send(compl2_req);

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

      it('should return http 400 if request is empty', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send();

        expect(res).to.have.status(400);
      });

      it('should return http 400 if request is an empty object', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send({});

        expect(res).to.have.status(400);
      });

      it('should return http 400 if an empty text is given', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send({
            compliance_text: '',
          });

        expect(res).to.have.status(400);
      });

      it('should return http 422 if a text is given but no app compliance', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
          });

        expect(res).to.have.status(422);
      });

      it('should return http 422 if no app compliance', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
            compliance_system: {},
          });

        expect(res).to.have.status(422);
      });

      it('should return http 422 if app compliance is false', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send({
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
            compliance_system: {
              app: false,
            },
          });

        expect(res).to.have.status(422);
      });

      it('should return http 200 if app compliance is true', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
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

        expect(res).to.have.status(200);
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
