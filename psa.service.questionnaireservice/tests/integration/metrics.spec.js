const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT;

describe('/metrics', () => {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  describe('GET /metrics', async () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(200);
      expect(result.text).to.be.an('string');
    });
  });
});
