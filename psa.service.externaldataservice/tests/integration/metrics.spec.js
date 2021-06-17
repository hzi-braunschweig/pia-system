const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT;

const serverSandbox = require('sinon').createSandbox();
const modysImportService = require('../../src/services/modysImportService');

describe('/metrics', () => {
  before(async function () {
    serverSandbox.stub(modysImportService, 'updatePersonalData');
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  describe('GET /metrics', async () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(200);
      expect(result.text).to.be.an('string');
    });
  });
});
