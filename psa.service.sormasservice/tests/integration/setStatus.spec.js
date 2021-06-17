const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = require('sinon').createSandbox();

const fetch = require('node-fetch');
const server = require('../../src/server');
const questionnaireInstancesService = require('../../src/services/questionnaireInstancesService');
const { ListeningDbClient } = require('@pia/lib-service-core');

const apiAddress = 'http://localhost:' + process.env.INTERNAL_PORT;

describe('setStatus', () => {
  before(async function () {
    sandbox.stub(
      questionnaireInstancesService,
      'checkAndUploadQuestionnaireInstances'
    );
    sandbox.stub(ListeningDbClient.prototype);
    sandbox
      .stub(fetch, 'Promise')
      .returns(
        Promise.resolve({ text: () => Promise.resolve('true'), ok: true })
      );
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  afterEach(async function () {
    sandbox.restore();
  });

  describe('POST /sormas/probands/setStatus', () => {
    it('should return 200 for a correct status', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/sormas/probands/setStatus')
        .send({
          uuid: 'ABCD-EFGH',
          status: 'REGISTERED',
        });
      expect(result).to.have.status(200);
    });

    it('should return 400 for an unexpected status', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/sormas/probands/setStatus')
        .send({
          uuid: 'ABCD-EFGH',
          status: 'DOES_NOT_EXIST',
        });
      expect(result).to.have.status(400);
    });
  });
});
