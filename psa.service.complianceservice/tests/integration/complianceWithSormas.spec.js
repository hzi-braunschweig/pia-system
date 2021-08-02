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
const serverSandbox = sinon.createSandbox();

const apiAddress = 'http://localhost:' + process.env.PORT;

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');
const sormasserviceClient = require('../../src/clients/sormasserviceClient');

const { config } = require('../../src/config');
const userserviceUrl = config.services.userservice.url;
const sormasserviceUrl = config.services.sormasservice.url;

const probandSession = {
  id: 1,
  role: 'Proband',
  username: 'QTestproband1',
  groups: ['QTeststudie1', 'QTeststudie2'],
};
const probandSession2 = {
  id: 2,
  role: 'Proband',
  username: 'QTestproband2',
  groups: ['QTeststudie44', 'QTeststudie55'],
};

const probandToken = JWT.sign(probandSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const probandHeader = { authorization: probandToken };
const probandHeader2 = { authorization: probandToken2 };

describe('Compliance API with SORMAS active', () => {
  before(async () => {
    await sequelize.sync();
    serverSandbox.stub(config, 'isSormasActive').value(true);
    await server.init();
  });

  after(async () => {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(async () => {
    await Compliance.destroy({ truncate: true, cascade: true });
    await ComplianceText.destroy({ truncate: true, cascade: true });
  });

  describe('POST /compliance/{study}/agree/{userId}', () => {
    describe('Without working sub-service ids', () => {
      it('should return http 503 if ids lookup fails', async function () {
        this.timeout(8000);
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send(compl_req);

        expect(res).to.have.status(503);
      });
    });

    describe('Without working sub-service status', () => {
      beforeEach(() => {
        testSandbox.stub(fetch, 'default').callsFake(async (url) => {
          if (url === userserviceUrl + '/user/users/QTestproband1/ids') {
            return new fetch.Response('fff70d12-847e-4d73-97ba-24d1571e37ab');
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

      afterEach(() => {
        testSandbox.restore();
      });

      it('should return http 503 if setStatus fails', async () => {
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send(compl_req);

        expect(res).to.have.status(503);
      });
    });

    describe('With working sub-services', () => {
      let fetchStub;

      beforeEach(() => {
        fetchStub = testSandbox
          .stub(fetch, 'default')
          .callsFake(async (url) => {
            if (url === userserviceUrl + '/user/users/QTestproband1/ids') {
              return new fetch.Response('fff70d12-847e-4d73-97ba-24d1571e37ab');
            } else if (
              url ===
              sormasserviceUrl + '/sormas/probands/setStatus'
            ) {
              return new fetch.Response();
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

      afterEach(() => {
        testSandbox.restore();
      });

      it('should return http 200 and update if compliance_text exists', async () => {
        const now = Date.now();
        await ComplianceText.create({
          study: 'QTeststudie1',
          text: '<pia-consent-radio-app></pia-consent-radio-app>',
          to_be_filled_by: 'Proband',
        });
        const setStatusSpy = testSandbox.spy(sormasserviceClient, 'setStatus');
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband1')
          .set(probandHeader)
          .send(compl_req);

        expect(res).to.have.status(200);
        expect(res.body).to.haveOwnProperty('timestamp');
        expect(res.body).excluding('timestamp').to.deep.equal(compl_res);
        const complDb = await Compliance.findOne({
          where: {
            mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
            study: 'QTeststudie1',
          },
        });
        expect(new Date(complDb.timestamp).getTime()).to.be.greaterThan(
          now - 1
        );
        expect(complDb.complianceText).to.equal(compl.complianceText);
        expect(fetchStub.callCount).to.equal(3); // lookupIds, lookupMappingId and setStatus
        expect(setStatusSpy.calledOnce).to.be.true;
        expect(
          setStatusSpy.calledWith(
            'fff70d12-847e-4d73-97ba-24d1571e37ab',
            'ACCEPTED'
          )
        ).to.be.true;
      });

      it('should return 401 if an unauthorized proband tires', async () => {
        const res = await chai
          .request(apiAddress)
          .post('/compliance/QTeststudie1/agree/QTestproband2')
          .set(probandHeader2)
          .send(compl_req);
        expect(res).to.have.status(401);
      });
    });
  });

  const compl = {
    username: 'QTestproband1',
    study: 'QTeststudie1',
    timestamp: '2020-05-29 10:17:02',
    complianceText: 'newest',
    firstname: 'Test',
    lastname: 'Proband',
    location: null,
    birthdate: '1972-06-22',
    complianceApp: true,
    complianceBloodsamples: true,
    complianceLabresults: false,
    complianceSamples: false,
  };

  const compl_req = {
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

  const compl_res = {
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
    timestamp: '2020-05-29 10:17:02',
  };
});
