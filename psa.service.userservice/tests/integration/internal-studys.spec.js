const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

const server = require('../../src/server');

const internalApiAddress = 'http://localhost:' + process.env.INTERNAL_PORT;

const { db } = require('../../src/db');

describe('Internal: studies', () => {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  describe('GET /user/users/{username}/primaryStudy', () => {
    before(async () => {
      await db.none(
        "INSERT INTO users (username, password, role) VALUES ('QTestProband1','', 'Proband');"
      );
      await db.none("INSERT INTO studies (name) VALUES ('TestStudy')");
      await db.none(
        "INSERT INTO study_users (study_id, user_id, access_level) VALUES ('TestStudy', 'QTestProband1', 'read');"
      );
    });

    after(async () => {
      await db.none("DELETE FROM users WHERE username = 'QTestProband1'");
      await db.none("DELETE FROM studies WHERE name = 'TestStudy'");
    });

    it('should resolve the name of the study a proband is assigned to', async function () {
      const result = await chai
        .request(internalApiAddress)
        .get('/user/users/QTestProband1/primaryStudy');
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('TestStudy');
    });
  });
});
