const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

const server = require('../../src/server');

const internalApiAddress = 'http://localhost:' + process.env.INTERNAL_PORT;

const { db } = require('../../src/db');

describe('Internal: get proband', () => {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  describe('GET /user/users/{username}', () => {
    before(async () => {
      await db.none(
        "INSERT INTO users (username, password, role, account_status) VALUES ('QTestProband1','', 'Proband', 'active');"
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

    it('should return HTTP 200 with proband', async function () {
      // Arrange
      const username = 'QTestProband1';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get(`/user/users/${username}`);

      // Assert
      expect(result).to.have.status(200);
      expect(result.body.username).to.equal('QTestProband1');
      expect(result.body.account_status).to.equal('active');
    });

    it('should return HTTP 404 if proband does not exist', async function () {
      // Arrange
      const username = 'QTestProband999';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get(`/user/users/${username}`);

      // Assert
      expect(result).to.have.status(404);
    });
  });
});
