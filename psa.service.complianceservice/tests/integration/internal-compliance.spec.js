const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
chai.use(chaiHttp);
chai.use(chaiExclude);
const expect = chai.expect;
const sinon = require('sinon');

const server = require('../../src/server');
const { sequelize, ComplianceText, Compliance } = require('../../src/db');

const apiAddress = 'http://localhost:' + process.env.INTERNAL_PORT;

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');

const { config } = require('../../src/config');
const userserviceUrl = config.services.userservice.url;

describe('Internal: Compliance API', () => {
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
            compliance_bloodsamples: false,
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

  describe('GET /compliance/{study}/agree/{userId}', () => {
    it('should return http 200 and true with no questioned compliance', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1');

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });

    it('should return http 200 true for single app question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
        .query({ system: 'app' });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });

    it('should return http 200 false for single bloodsamples question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
        .query({ system: 'bloodsamples' });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(false);
    });

    it('should return http 200 true for samples and labresults question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
        .query({ system: ['samples', 'labresults'] });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.equal(true);
    });

    it('should return http 200 false for bloodsamples and labresults question', async () => {
      const res = await chai
        .request(apiAddress)
        .get('/compliance/QTeststudie1/agree/QTestproband1')
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
        .get('/compliance/QTeststudie1/agree/QTestproband1')
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
