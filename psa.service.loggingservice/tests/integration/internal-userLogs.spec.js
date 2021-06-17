const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { db } = require('../../src/db');
const { setupFile, cleanupFile } = require('./systemLogs.spec.data/sqlFiles');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.INTERNAL_PORT + '/log';

describe('Internal: /log/logs', () => {
  before(async () => {
    await server.init();
  });

  after(async () => {
    await server.stop();
  });

  describe('DELETE /log/logs/{user_id}', () => {
    beforeEach(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });

    afterEach(async function () {
      await db.none(cleanupFile);
    });

    it('should return 200 delete all logs of a proband', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/logs/QTestProband1');
      expect(result).to.have.status(204);
      const logs = await db.manyOrNone(
        "SELECT * FROM user_logs WHERE user_id = 'QTestProband1'"
      );
      expect(logs.length).to.equal(0);
    });
  });

  describe('POST /log/logs', async () => {
    const logs = [
      {
        timestamp: '2018-11-11T00:30:00.000Z',
        app: 'web',
        activity: {
          type: 'login',
        },
      },

      {
        timestamp: '2018-11-11T00:32:00.000Z',
        app: 'web',
        activity: {
          type: 'logout',
        },
      },
      {
        timestamp: '2018-11-11T00:35:00.000Z',
        app: 'web',
        activity: {
          type: 'q_released_once',
          questionnaireID: '1',
          questionnaireInstanceId: '11',
        },
      },
      {
        timestamp: '2018-11-11T00:36:00.000Z',
        app: 'web',
        activity: {
          type: 'q_released_twice',
          questionnaireID: '1',
          questionnaireInstanceId: '11',
        },
      },
    ];

    const badLog1 = {
      timestamp: '2018-11-11T00:30:00.000Z',
      app: 'web',
      activity: {
        type: 'twice',
        questionnaireID: '1',
        questionnaireInstanceId: '11',
      },
    };

    const badLog2WithoutTimestamp = {
      app: 'web',
      activity: {
        type: 'new',
        questionnaireID: '1',
        questionnaireInstanceId: '11',
      },
    };

    before(async () => {
      await db.none(cleanupFile);
    });

    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return 200 log content if Proband posts a log of type "login"', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/logs/QTestProband1')
        .send(logs[0]);
      expect(result).to.have.status(200);
      expect(result.body.timestamp).to.equal(logs[0].timestamp);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.activity.type).to.equal(logs[0].activity.type);
    });

    it('should return 200 log content if Proband posts a log of type "logout"', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/logs/QTestProband1')
        .send(logs[1]);
      expect(result).to.have.status(200);
      expect(result.body.timestamp).to.equal(logs[1].timestamp);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.activity.type).to.equal(logs[1].activity.type);
    });

    it('should return 200 log content if Proband posts a log of type "released_once"', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/logs/QTestProband1')
        .send(logs[2]);
      expect(result).to.have.status(200);
      expect(result.body.timestamp).to.equal(logs[2].timestamp);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.activity.type).to.equal(logs[2].activity.type);
    });

    it('should return 200 log content if Proband posts a log of type "released_twice"', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/logs/QTestProband1')
        .send(logs[3]);
      expect(result).to.have.status(200);
      expect(result.body.timestamp).to.equal(logs[3].timestamp);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.activity.type).to.equal(logs[3].activity.type);
    });

    it('should return 400 if there is no timestamp', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/logs/QTestProband1')
        .send(badLog2WithoutTimestamp);

      expect(result).to.have.status(400);
    });

    it('should return 400 if log has not correct type', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/logs/QTestProband1')
        .send(badLog1);

      expect(result).to.have.status(400);
    });
  });
});
