const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');

const { db } = require('../../src/db');

const server = require('../../src/server');
const internalApiAddress = 'http://localhost:' + process.env.INTERNAL_PORT;
const serverSandbox = sinon.createSandbox();

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');
const { config } = require('../../src/config');
const loggingserviceUrl = config.services.loggingservice.url;
const sormasserviceUrl = config.services.sormasservice.url;
const sormasserviceClient = require('../../src/clients/sormasserviceClient');
const loggingserviceClient = require('../../src/clients/loggingserviceClient');

describe('Internal: delete proband data', () => {
  let fetchStub;

  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(async () => {
    fetchStub = testSandbox.stub(fetch, 'default');
    fetchStub.callsFake(async (url) => {
      console.log(url);
      let body;
      if (url === sormasserviceUrl + '/sormas/probands/setStatus') {
        body = {};
      } else if (url === loggingserviceUrl + '/log/logs/DeleteMe') {
        body = {};
      } else {
        return new fetch.Response(null, { status: 404 });
      }
      return new fetch.Response(JSON.stringify(body));
    });
    await db.none(
      "INSERT INTO users (username, password, role, ids) VALUES ('DeleteMe', '', 'Proband', '53ae2aea-67bc-4365-9d63-8acdc275d98c')"
    );
  });

  afterEach(async () => {
    testSandbox.restore();
    await db.none("DELETE FROM users WHERE username ='DeleteMe'");
  });

  describe('DELETE /user/users/{username}', () => {
    let setStatusSpy;
    let deleteLogsSpy;
    beforeEach(() => {
      setStatusSpy = testSandbox.spy(sormasserviceClient, 'setStatus');
      deleteLogsSpy = testSandbox.spy(loggingserviceClient, 'deleteLogs');
    });

    describe('with sormas active', () => {
      beforeEach(async () => {
        testSandbox.stub(config, 'isSormasActive').value(true);
      });
      it('should set the "DELETED" status in SORMAS', async function () {
        const result = await chai
          .request(internalApiAddress)
          .delete('/user/users/DeleteMe');
        expect(result).to.have.status(200);

        expect(setStatusSpy.calledOnce).to.be.true;
        expect(
          setStatusSpy.calledWith(
            '53ae2aea-67bc-4365-9d63-8acdc275d98c',
            'DELETED'
          )
        ).to.be.true;
        expect(deleteLogsSpy.calledOnce).to.be.true;
      });
    });
  });
});
