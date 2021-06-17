const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

describe('expiredUsersDeletionService', () => {
  describe('checkAndDeleteExpiredUsers', () => {
    it('should delete all users returned from db', async () => {
      // Arrange
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const db = {
        manyOrNone: sinon.fake.resolves(createQuestionnaireInstance()),
      };
      const expiredUsersDeletionService = proxyquire(
        './expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      // Act
      await expiredUsersDeletionService.checkAndDeleteExpiredUsers(db);

      // Assert
      expect(userserviceClient.deleteUserdata.callCount).to.equal(5);
      expect(userserviceClient.deleteUserdata.calledWith('DO_DELETE_USER_1')).to
        .be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DO_DELETE_USER_2')).to
        .be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DO_DELETE_USER_3')).to
        .be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DO_DELETE_USER_4')).to
        .be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DO_DELETE_USER_5')).to
        .be.true;
    });
  });

  describe('checkAndDeleteSingleUser', () => {
    it('should delete a user if it was returned from db', async () => {
      // Arrange
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const db = {
        oneOrNone: sinon.fake.resolves({ user_id: 'DO_DELETE_USER_3' }),
      };
      const expiredUsersDeletionService = proxyquire(
        './expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      // Act
      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DO_DELETE_USER_3',
        db
      );

      // Assert
      expect(userserviceClient.deleteUserdata.calledOnce).to.be.true;
      expect(userserviceClient.deleteUserdata.calledWith('DO_DELETE_USER_3')).to
        .be.true;
    });

    it('should not delete a user if it was not returned from db', async () => {
      // Arrange
      const userserviceClient = { deleteUserdata: sinon.fake.resolves() };
      const db = { oneOrNone: sinon.fake.resolves(null) };
      const expiredUsersDeletionService = proxyquire(
        './expiredUsersDeletionService',
        {
          '../clients/userserviceClient': userserviceClient,
        }
      );

      // Act
      await expiredUsersDeletionService.checkAndDeleteSingleUser(
        'DO_DELETE_USER_3',
        db
      );

      // Assert
      expect(userserviceClient.deleteUserdata.notCalled).to.be.true;
    });
  });

  function createQuestionnaireInstance() {
    return [
      { user_id: 'DO_DELETE_USER_1' },
      { user_id: 'DO_DELETE_USER_2' },
      { user_id: 'DO_DELETE_USER_3' },
      { user_id: 'DO_DELETE_USER_4' },
      { user_id: 'DO_DELETE_USER_5' },
    ];
  }
});
