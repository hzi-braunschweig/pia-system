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

const { sequelize, ComplianceText, Compliance } = require('../../src/db');

const { config } = require('../../src/config');
const { Server } = require('../../src/server');
const {
  AuthServerMock,
  AuthTokenMockBuilder,
} = require('@pia/lib-service-core');
const apiAddress = `http://localhost:${config.public.port}`;

const complianceManagerHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'qtest-ewmanager',
  studies: ['test-study1'],
});
const complianceManagerHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'qtest-ewmanager2',
  studies: ['test-study3'],
});
const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['test-study1'],
});

describe('Compliance Agreements API', () => {
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

    await Compliance.create({
      id: 1,
      study: 'test-study1',
      mappingId: 'e894d9e8-be87-4801-8c75-d35cef521eb1',
      complianceText:
        'Hello\n' +
        '<pia-consent-input-text-firstname></pia-consent-input-text-firstname>\n' +
        '<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\n' +
        'End of text\n',
      username: 'user1',
      ids: '',
      firstname: '',
      lastname: '',
      birthdate: '1983-08-03',
      location: '',
      compliance_app: true,
      compliance_samples: false,
      compliance_bloodsamples: false,
      compliance_labresults: false,
    });

    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(AuthServerMock.cleanAll);

  describe('GET /admin/agree/all', () => {
    it('should return a list of the compliance agreements to which the professional user has access to without leaking sensitive data', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/admin/agree/all')
        .set(complianceManagerHeader)
        .send();
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal([
        {
          id: 1,
          study: 'test-study1',
          username: 'user1',
          ids: '',
          firstname: '',
          lastname: '',
          birthdate: '1983-08-03',
        },
      ]);
    });

    it('should return 403 if the wrong role tries', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/admin/agree/all')
        .set(probandHeader)
        .send();
      expect(res).to.have.status(403);
    });
  });

  describe('GET /admin/{studyName}/agree/instance/{id}', () => {
    it('should return the compliance agree based on its given database ID', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/admin/test-study1/agree/instance/1')
        .set(complianceManagerHeader)
        .send();
      expect(res).to.have.status(200);

      // for some reason timestamps are not matched correctly due to different T0 values
      delete res.body.timestamp;

      expect(res.body).to.deep.equal({
        compliance_text:
          'Hello\n' +
          '<pia-consent-input-text-firstname></pia-consent-input-text-firstname>\n' +
          '<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\n' +
          'End of text\n',
        compliance_text_object: [
          { type: 'HTML', html: '<p>Hello\n</p>' },
          {
            type: 'CUSTOM_TAG',
            attrs: [],
            children: [],
            tagName: 'pia-consent-input-text-firstname',
          },
          { type: 'HTML', html: '<p>\n</p>' },
          {
            type: 'CUSTOM_TAG',
            attrs: [],
            children: [],
            tagName: 'pia-consent-input-radio-labresults',
          },
          { type: 'HTML', html: '<p>\nEnd of text</p>' },
        ],
        textfields: {
          firstname: '',
          lastname: '',
          location: '',
          birthdate: '1983-08-03',
        },
        compliance_system: {
          app: false,
          samples: false,
          bloodsamples: false,
          labresults: false,
        },
        compliance_questionnaire: [],
      });
    });

    it('should return 403 if the compliance manager does not have access to the compliance study', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/admin/test-study1/agree/instance/1')
        .set(complianceManagerHeader2)
        .send();
      expect(res).to.have.status(403);
    });

    it('should return 403 if the wrong role tries', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/admin/test-study1/agree/instance/1')
        .set(probandHeader)
        .send();
      expect(res).to.have.status(403);
    });
  });
});
