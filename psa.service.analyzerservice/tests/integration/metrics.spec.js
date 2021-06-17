const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT;

describe('GET /metrics', async function () {
  before(async function () {
    await server.init();
  });

  after(async function () {
    try {
      await server.stop();
    } catch (err) {
      console.error(err);
    }
  });

  it('should return http 200 with a string', async () => {
    const result = await chai.request(apiAddress).get('/metrics');
    expect(result).to.have.status(200);
    expect(result.text).to.be.an('string');
  });
});
