/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
const expect = chai.expect;
const sinon = require('sinon');
const fetchMocker = require('fetch-mock');

const { HttpClient } = require('@pia-system/lib-http-clients-internal');
const { config } = require('../../src/config');
const { Server } = require('../../src/server');
const { sequelize, ComplianceText, Compliance } = require('../../src/db');

chai.use(chaiHttp);
chai.use(chaiExclude);

const testSandbox = sinon.createSandbox();

const apiAddress = `http://localhost:${config.internal.port}`;

const fetchMock = fetchMocker.sandbox();

describe('Internal: Compliance API', () => {
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
          complianceBloodsamples: false,
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

  describe('GET /compliance/{studyName}/agree/{userId}', () => {
    it('should return http 200 and true with no questioned compliance', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/qtest-proband1');

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });

    it('should return http 200 true for single app question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/qtest-proband1')
        .query({ system: 'app' });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });

    it('should return http 200 false for single bloodsamples question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/qtest-proband1')
        .query({ system: 'bloodsamples' });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(false);
    });

    it('should return http 200 true for samples and labresults question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/qtest-proband1')
        .query({ system: ['samples', 'labresults'] });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });

    it('should return http 200 false for bloodsamples and labresults question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/qtest-proband1')
        .query({ system: ['bloodsamples', 'labresults'] });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(false);
    });

    it('should return http 200 and true for app from internal compliance', async () => {
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      await Compliance.create(compl2);
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/qtest-proband1')
        .query({ system: 'app' });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });
  });

  const compl2 = {
    mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
    study: 'QTeststudie1',
    timestamp: '2020-05-29T10:17:02.000Z',
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
});
