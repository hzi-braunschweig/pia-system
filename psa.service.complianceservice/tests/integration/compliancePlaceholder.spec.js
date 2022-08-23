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

const { config } = require('../../src/config');
const server = require('../../src/server');
const apiAddress = `http://localhost:${config.public.port}`;

const {
  sequelize,
  ComplianceQuestionnairePlaceholder,
} = require('../../src/db');
const {
  AuthTokenMockBuilder,
  AuthServerMock,
} = require('@pia/lib-service-core');

const researcherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTeststudy', 'QTeststudie2'],
});
const researcherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher2',
  studies: ['QTeststudy44', 'QTeststudie55'],
});
const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  groups: ['QTeststudy'],
});

describe('Compliance Placeholder API', () => {
  const studyName = 'QTeststudy';
  const placeholder = [
    {
      study: studyName,
      type: 'RADIO',
      placeholder: 'placeholder10',
    },
    {
      study: studyName,
      type: 'RADIO',
      placeholder: 'placeholder11',
    },
    {
      study: studyName,
      type: 'TEXT',
      placeholder: 'anyname',
      label: 'My name is',
    },
    {
      study: studyName,
      type: 'RADIO',
      placeholder: 'placeholder12',
    },
  ];
  before(async () => {
    await sequelize.sync();
    await server.init();
  });

  after(async () => {
    await server.stop();
  });

  beforeEach(async () => {
    await ComplianceQuestionnairePlaceholder.destroy({
      truncate: true,
      cascade: true,
    });
    await ComplianceQuestionnairePlaceholder.bulkCreate(placeholder);
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(AuthServerMock.cleanAll);

  describe('GET /admin/{studyName}/questionnaire-placeholder', () => {
    it('should return 200 and all questionnaire-placeholder of the given study', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(4);
      placeholder.forEach((p1) => {
        const myNamePlaceholder = res.body.find(
          (p2) => p1.placeholder === p2.placeholder
        );
        expect(myNamePlaceholder.type).to.equal(p1.type);
        expect(myNamePlaceholder.label).to.equal(p1.label || null);
      });
    });

    it('should return 403 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader2);
      expect(res).to.have.status(403);
    });

    it('should return 403 if proband tries', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/questionnaire-placeholder`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(403);
    });
  });

  describe('POST /admin/{studyName}/questionnaire-placeholder', () => {
    it('should return 200 with all questionnaire-placeholder of the given study and create a new RADIO', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/admin/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader)
        .send({ type: 'RADIO', placeholder: 'placeholder100' });
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      const dbPlaceholder = await ComplianceQuestionnairePlaceholder.findOne({
        where: {
          study: studyName,
          type: 'RADIO',
          placeholder: 'placeholder100',
        },
      });
      expect(dbPlaceholder).to.not.be.null;
    });

    it('should return 200 with all questionnaire-placeholder of the given study and create a new TEXT', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/admin/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader)
        .send({
          type: 'TEXT',
          placeholder: 'placeholder101',
          label: 'My Placeholder',
        });
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      const dbPlaceholder = await ComplianceQuestionnairePlaceholder.findOne({
        where: {
          study: studyName,
          type: 'TEXT',
          placeholder: 'placeholder101',
          label: 'My Placeholder',
        },
      });
      expect(dbPlaceholder).to.not.be.null;
    });

    it('should return 403 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/admin/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader2)
        .send({ type: 'RADIO', placeholder: 'placeholder100' });
      expect(res).to.have.status(403);
    });

    it('should return 403 if proband tries', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/admin/${studyName}/questionnaire-placeholder`)
        .set(probandHeader)
        .send({
          type: 'TEXT',
          placeholder: 'placeholder101',
          label: 'My Placeholder',
        });

      // Assert
      expect(res).to.have.status(403);
    });
  });
});
