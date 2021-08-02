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

const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT;

const {
  sequelize,
  ComplianceQuestionnairePlaceholder,
} = require('../../src/db');

const researcherSession = {
  id: 1,
  role: 'Forscher',
  username: 'QTestforscher1',
  groups: ['QTeststudy', 'QTeststudie2'],
};

const researcherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestforscher2',
  groups: ['QTeststudy44', 'QTeststudie55'],
};

const researcherToken = JWT.sign(researcherSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const researcherToken2 = JWT.sign(researcherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const researcherHeader = { authorization: researcherToken };
const researcherHeader2 = { authorization: researcherToken2 };

const probandSession = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTeststudy', 'QTeststudie2'],
};

const probandToken = JWT.sign(probandSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const probandHeader = { authorization: probandToken };

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
  });

  describe('GET /compliance/{study}/questionnaire-placeholder', () => {
    it('should return 200 and all questionnaire-placeholder of the given study', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/compliance/${studyName}/questionnaire-placeholder`)
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

    it('should return 401 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/compliance/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader2);
      expect(res).to.have.status(401);
    });

    it('should return 403 if proband tires', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/compliance/${studyName}/questionnaire-placeholder`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(403);
    });
  });

  describe('POST /compliance/{study}/questionnaire-placeholder', () => {
    it('should return 200 with all questionnaire-placeholder of the given study and create a new RADIO', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/compliance/${studyName}/questionnaire-placeholder`)
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
        .post(`/compliance/${studyName}/questionnaire-placeholder`)
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

    it('should return 401 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/compliance/${studyName}/questionnaire-placeholder`)
        .set(researcherHeader2)
        .send({ type: 'RADIO', placeholder: 'placeholder100' });
      expect(res).to.have.status(401);
    });

    it('should return 403 if proband tires', async () => {
      const res = await chai
        .request(apiAddress)
        .post(`/compliance/${studyName}/questionnaire-placeholder`)
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
