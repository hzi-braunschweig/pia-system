const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
chai.use(chaiHttp);
chai.use(chaiExclude);
const binaryParser = require('superagent-binary-parser');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs');

const secretOrPrivateKey = require('../../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const server = require('../../../src/server');
const {
  sequelize,
  ComplianceText,
  Compliance,
  QuestionnaireCompliance,
  QuestionnaireTextCompliance,
} = require('../../../src/db');

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');

const { config } = require('../../../src/config');
const userserviceUrl = config.services.userservice.url;

const apiAddress = 'http://localhost:' + config.public.port;

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestproband1',
  groups: ['QTeststudie1'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestproband2',
  groups: ['QTeststudie44'],
};
const complianceManagerSession = {
  id: 1,
  role: 'EinwilligungsManager',
  username: 'ewManager',
  groups: ['QTeststudie1'],
};
const complianceManagerSession2 = {
  id: 1,
  role: 'EinwilligungsManager',
  username: 'ewManager2',
  groups: ['QTeststudie66, QTeststudie77'],
};

const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const complianceManagerToken = JWT.sign(
  complianceManagerSession,
  secretOrPrivateKey,
  {
    algorithm: 'RS512',
    expiresIn: '24h',
  }
);
const complianceManagerToken2 = JWT.sign(
  complianceManagerSession2,
  secretOrPrivateKey,
  {
    algorithm: 'RS512',
    expiresIn: '24h',
  }
);

const probandHeader = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const complianceManagerHeader = { authorization: complianceManagerToken };
const complianceManagerHeader2 = { authorization: complianceManagerToken2 };

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

    testSandbox.stub(fetch, 'default').callsFake(async (url) => {
      if (url === userserviceUrl + '/user/users/QTestproband1/mappingId') {
        return new fetch.Response('e959c22a-ab73-4b70-8871-48c23080b87b');
      } else {
        return new fetch.Response(null, { status: 503 });
      }
    });
  });
  afterEach(async () => {
    testSandbox.restore();
  });

  describe('GET /compliance/{study}/agree-pdf/{userId}', () => {
    it('should return http 404 if no compliance exists', async function () {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree-pdf/QTestproband1')
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
        .get('/compliance/QTeststudie1/agree-pdf/QTestproband1')
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
        .get('/compliance/QTeststudie1/agree-pdf/QTestproband1')
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

    it('should return 401 if an unauthorized proband tries', async function () {
      this.timeout(5000);
      await Compliance.create(compl2, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree-pdf/QTestproband2')
        .set(probandHeader2)
        .parse(binaryParser)
        .buffer();

      // Assert
      expect(res).to.have.status(401);
    });
  });

  describe('GET /compliance/{study}/agree-pdf/instance/{id}', () => {
    it('should return http 404 if no compliance exists', async function () {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree-pdf/instance/123465')
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
        .get(`/compliance/QTeststudie1/agree-pdf/instance/${compliance.id}`)
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

    it('should return 401 if an unauthorized compliance manager tries', async function () {
      this.timeout(5000);
      const compliance = await Compliance.create(compl2, {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      });
      const res = await chai
        .request(apiAddress)
        .get(`/compliance/QTeststudie1/agree-pdf/instance/${compliance.id}`)
        .set(complianceManagerHeader2)
        .parse(binaryParser)
        .buffer();

      // Assert
      expect(res).to.have.status(401);
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
