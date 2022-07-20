/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
const binaryParser = require('superagent-binary-parser');
const sinon = require('sinon');
const fs = require('fs');
const fetchMocker = require('fetch-mock');

const { HttpClient } = require('@pia-system/lib-http-clients-internal');
const server = require('../../../src/server');
const {
  sequelize,
  ComplianceText,
  Compliance,
  QuestionnaireCompliance,
  QuestionnaireTextCompliance,
} = require('../../../src/db');
const { config } = require('../../../src/config');
const {
  AuthTokenMockBuilder,
  AuthServerMock,
} = require('@pia/lib-service-core');

const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiExclude);

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
  studies: ['QTeststudie44'],
});
const complianceManagerHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'qtest-ewmanager',
  studies: ['QTeststudie1'],
});
const complianceManagerHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'qtest-ewmanager2',
  studies: ['QTeststudie66, QTeststudie77'],
});

const fetchMock = fetchMocker.sandbox();

describe('Compliance PDF API', function () {
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

    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);

    fetchMock
      .get('express:/user/users/qtest-proband1/mappingId', {
        body: 'e959c22a-ab73-4b70-8871-48c23080b87b',
      })
      .catch(503);
  });
  afterEach(async () => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /{studyName}/agree-pdf/{pseudonym}', () => {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return http 404 if no compliance exists', async function () {
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree-pdf/qtest-proband1')
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(404);
    });

    it('should return http 200 and the pdf', async function () {
      this.timeout(5000);
      await Compliance.create(compl2, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree-pdf/qtest-proband1')
        .set(probandHeader)
        .parse(binaryParser)
        .buffer();

      // Assert
      expect(res).to.have.status(200);
      expect(res.header['content-type']).to.equal('application/pdf');
      expect(res.header['content-disposition']).to.equal(
        'attachment; filename=consent.pdf'
      );
      expect(res.body.length).to.be.greaterThan(50000);
      require('fs').writeFileSync('./tests/reports/meine1.pdf', res.body);
    });

    it('should return http 200 and the pdf', async function () {
      this.timeout(5000);
      await Compliance.create(compl1, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree-pdf/qtest-proband1')
        .set(probandHeader)
        .buffer();

      // Assert
      expect(res).to.have.status(200);
      expect(res.headers['content-type']).to.equal('application/pdf');
      expect(res.headers['content-disposition']).to.match(
        /attachment; filename=\S*\.pdf/
      );
      expect(res.body.length).to.be.greaterThan(1000);
      require('fs').writeFileSync('./tests/reports/meine2.pdf', res.body);
    });

    it('should also accept pseudonyms in uppercase and return http 200', async function () {
      this.timeout(5000);
      await Compliance.create(compl1, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree-pdf/QTest-Proband1')
        .set(probandHeader)
        .buffer();

      // Assert
      expect(res).to.have.status(200);
    });

    it('should return 403 if an unauthorized proband tries', async function () {
      this.timeout(5000);
      await Compliance.create(compl2, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get('/QTeststudie1/agree-pdf/qtest-proband2')
        .set(probandHeader2)
        .parse(binaryParser)
        .buffer();

      // Assert
      expect(res).to.have.status(403);
    });
  });

  describe('GET /admin/{studyName}/agree-pdf/instance/{id}', () => {
    beforeEach(() => AuthServerMock.adminRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return http 404 if no compliance exists', async function () {
      const res = await chai
        .request(apiAddress)
        .get('/admin/QTeststudie1/agree-pdf/instance/123465')
        .set(complianceManagerHeader);
      expect(res).to.have.status(404);
    });

    it('should return http 200 and the pdf', async function () {
      this.timeout(5000);
      const compliance = await Compliance.create(compl2, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get(`/admin/QTeststudie1/agree-pdf/instance/${compliance.id}`)
        .set(complianceManagerHeader)
        .parse(binaryParser)
        .buffer();

      // Assert
      expect(res).to.have.status(200);
      expect(res.header['content-type']).to.equal('application/pdf');
      expect(res.header['content-disposition']).to.equal(
        'attachment; filename=consent.pdf'
      );
      expect(res.body.length).to.be.greaterThan(50000);
      require('fs').writeFileSync('./tests/reports/meine1.pdf', res.body);
    });

    it('should return 403 if an unauthorized compliance manager tries', async function () {
      this.timeout(5000);
      const compliance = await Compliance.create(compl2, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get(`/admin/QTeststudie1/agree-pdf/instance/${compliance.id}`)
        .set(complianceManagerHeader2)
        .parse(binaryParser)
        .buffer();

      // Assert
      expect(res).to.have.status(403);
    });
  });

  const compl1 = {
    mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
    study: 'QTeststudie1',
    timestamp: '2020-05-28T10:17:02',
    complianceText: fs.readFileSync(
      __dirname + '/compliance_text1.md',
      'utf-8'
    ),
    firstname: 'Max',
    lastname: 'Mustermann',
    location: 'Berlin',
    birthdate: '1976-07-30',
    complianceApp: true,
    complianceBloodsamples: true,
    complianceLabresults: true,
    complianceSamples: true,
    QuestionnaireCompliances: [
      {
        placeholder: 'Nutzerevaluation',
        value: true,
      },
      {
        placeholder: 'Spontanmeldung',
        value: true,
      },
    ],
    QuestionnaireTextCompliances: [
      {
        placeholder: 'address',
        value: 'The place I love to be',
      },
    ],
  };
  const compl2 = {
    mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
    study: 'QTeststudie1',
    timestamp: '2020-05-30T11:58:59.000Z',
    complianceText: fs.readFileSync(
      __dirname + '/compliance_text2.md',
      'utf-8'
    ),
    username: null,
    ids: null,
    firstname: 'Test',
    lastname: 'Proband',
    location: null,
    birthdate: '1972-06-22',
    complianceApp: true,
    complianceBloodsamples: null,
    complianceLabresults: null,
    complianceSamples: null,
    QuestionnaireTextCompliances: [
      {
        placeholder: 'freitext',
        value: 'Hier könnte ein beliebiger Text stehen!!!$%${{}}',
      },
    ],
    QuestionnaireCompliances: [
      {
        placeholder: 'lieblingsfeld',
        value: true,
      },
    ],
  };
});
