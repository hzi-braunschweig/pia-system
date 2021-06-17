const path = require('path');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();
const pgPromise = require('pg-promise');
const QueryFile = pgPromise.QueryFile;

const { db } = require('../../src/db');

const setupFile = new QueryFile(
  path.join(__dirname, 'expiredUsersDeletionService.spec.data/setup.sql'),
  { minify: true }
);
const cleanupFile = new QueryFile(
  path.join(__dirname, 'expiredUsersDeletionService.spec.data/cleanup.sql'),
  { minify: true }
);

describe('expiredUsersDeletionService', () => {
  beforeEach(async function () {
    await db.none(cleanupFile);
    await db.none(setupFile);
  });

  afterEach(async function () {
    await db.none(cleanupFile);
  });

  describe('checkAndDeleteExpiredUsers', () => {
    it('should delete all users without inactive, active or in_progress questionnaires', async () => {
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const expiredUsersDeletionService = proxyquire(
        '../../src/services/expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      await expiredUsersDeletionService.checkAndDeleteExpiredUsers(db);

      expect(
        userserviceClient.deleteUserdata.neverCalledWith(
          'DoNotDeleteUser1',
          true
        )
      ).to.be.true;
      expect(
        userserviceClient.deleteUserdata.neverCalledWith(
          'DoNotDeleteUser2',
          true
        )
      ).to.be.true;
      expect(
        userserviceClient.deleteUserdata.neverCalledWith(
          'DoNotDeleteUser3',
          true
        )
      ).to.be.true;

      expect(userserviceClient.deleteUserdata.calledWith('DoDeleteUser1', true))
        .to.be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DoDeleteUser2', true))
        .to.be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DoDeleteUser3', true))
        .to.be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DoDeleteUser4', true))
        .to.be.true;
    });
  });

  describe('checkAndDeleteSingleUser', () => {
    it('should delete a user without inactive, active or in_progress questionnaires', async () => {
      // Arrange
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const expiredUsersDeletionService = proxyquire(
        '../../src/services/expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DoDeleteUser4',
        db
      );

      expect(userserviceClient.deleteUserdata.calledOnce).to.be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DoDeleteUser4')).to.be
        .true;
    });

    it('should delete a user whose answers are already uploaded', async () => {
      // Arrange
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const expiredUsersDeletionService = proxyquire(
        '../../src/services/expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DoDeleteUser2',
        db
      );

      expect(userserviceClient.deleteUserdata.calledOnce).to.be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DoDeleteUser2', true))
        .to.be.true;
    });

    it('should not delete a user whose answers are not yet fully uploaded', async () => {
      // Arrange
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const expiredUsersDeletionService = proxyquire(
        '../../src/services/expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DoNotDeleteUser2',
        db
      );
      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DoNotDeleteUser4',
        db
      );
      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DoNotDeleteUser5',
        db
      );

      expect(userserviceClient.deleteUserdata.notCalled).to.be.true;
    });
  });
});
