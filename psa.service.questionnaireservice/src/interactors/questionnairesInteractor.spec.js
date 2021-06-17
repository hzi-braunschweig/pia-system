const sinon = require('sinon');
const expect = require('chai').expect;

const questionnairesInteractor = require('./questionnairesInteractor');

describe('questionnairesInteractor', function () {
  describe('#deleteQuestionnaire', function () {
    it('should not delete the questionnaire, if the user has unknown role', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .resolves({ access_level: 'write' }),
        deleteQuestionnaire: sinon.stub().withArgs(1).resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnairesInteractor
        .deleteQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(false);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
          expect(pgHelperMock.deleteQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it('should not delete the questionnaire, if the user has role "Proband"', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .resolves({ access_level: 'write' }),
        deleteQuestionnaire: sinon.stub().withArgs(1).resolves(null),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnairesInteractor
        .deleteQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(false);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
          expect(pgHelperMock.deleteQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should not delete the questionnaire, if the user has role "Forscher" but is not assigned to the right study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .rejects(),
        deleteQuestionnaire: sinon.stub().withArgs(1).resolves(null),
      };
      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .deleteQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.deleteQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should not delete the questionnaire, if the user has role "Forscher" but only has read access in study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .resolves({ access_level: 'read' }),
        deleteQuestionnaire: sinon.stub().withArgs(1).resolves(null),
      };
      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .deleteQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.deleteQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should delete the questionnaire, if the user has role "Forscher" and has write access in study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .resolves({ access_level: 'write' }),
        deleteQuestionnaire: sinon.stub().withArgs(1).resolves(null),
      };
      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .deleteQuestionnaire(session, 1, pgHelperMock)
        .then(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.deleteQuestionnaire.calledOnce).to.equal(true);
        });
    });
  });

  describe('#createQuestionnaire', function () {
    it('should not create the questionnaire, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        insertQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnairesInteractor
        .createQuestionnaire(session, {}, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
          expect(pgHelperMock.insertQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it('should not create the questionnaire, if the user has role "Proband"', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        insertQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnairesInteractor
        .createQuestionnaire(session, {}, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
          expect(pgHelperMock.insertQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it('should not create the questionnaire, if the user has role "Forscher" but is not assigned to the right study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .rejects(),
        insertQuestionnaire: sinon.stub().resolves(null),
      };
      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .createQuestionnaire(session, {}, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.insertQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it('should not create the questionnaire, if the user has role "Forscher" but only has read access in study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .resolves({ access_level: 'read' }),
        insertQuestionnaire: sinon.stub().resolves(null),
      };
      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .createQuestionnaire(session, {}, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.insertQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it('should create the questionnaire, if the user has role "Forscher" and has write access in study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .resolves({ access_level: 'write' }),
        insertQuestionnaire: sinon
          .stub()
          .withArgs({ study_id: 1 })
          .resolves({ study_id: 1, id: 1 }),
      };
      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .createQuestionnaire(session, {}, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.insertQuestionnaire.calledOnce).to.equal(true);
          expect(result.id).to.equal(1);
        });
    });
  });

  describe('#updateQuestionnaire', function () {
    it('should not update the questionnaire, if the user has unknown role', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.onCall(0).resolves({ access_level: 'write' });
      getStudyAccessForUserStub.onCall(1).resolves({ access_level: 'write' });

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, {}, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(false);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it('should not update the questionnaire, if the user has role "Proband"', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.onCall(0).resolves({ access_level: 'write' });
      getStudyAccessForUserStub.onCall(1).resolves({ access_level: 'write' });

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, {}, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(false);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should not update the questionnaire, if the user has role "Forscher" but is not assigned to the old study', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.withArgs(1).rejects();
      getStudyAccessForUserStub.withArgs(2).resolves({ access_level: 'write' });

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, { study_id: 2 }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should not update the questionnaire, if the user has role "Forscher" but is not assigned to the new study', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.withArgs(1).resolves({ access_level: 'write' });
      getStudyAccessForUserStub.withArgs(2).rejects();

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, { study_id: 2 }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(2);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should not update the questionnaire, if the user has role "Forscher" but only has read access in old study', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.withArgs(1).resolves({ access_level: 'read' });
      getStudyAccessForUserStub.withArgs(2).resolves({ access_level: 'write' });

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, { study_id: 2 }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(2);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should not update the questionnaire, if the user has role "Forscher" but only has read access in new study', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.withArgs(1).resolves({ access_level: 'write' });
      getStudyAccessForUserStub.withArgs(2).resolves({ access_level: 'read' });

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, { study_id: 2 }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(2);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(false);
        });
    });

    it.skip('should update the questionnaire, if the user has role "Forscher" and has write access in old and new study', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.withArgs(1).resolves({ access_level: 'write' });
      getStudyAccessForUserStub.withArgs(2).resolves({ access_level: 'write' });

      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: getStudyAccessForUserStub,
        updateQuestionnaire: sinon
          .stub()
          .withArgs({ study_id: 2 }, 1)
          .resolves({ study_id: 2 }),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .updateQuestionnaire(session, 1, { study_id: 2 }, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(2);
          expect(pgHelperMock.updateQuestionnaire.calledOnce).to.equal(true);
          expect(result.study_id).to.equal(2);
        });
    });
  });

  describe('#getQuestionnaire', function () {
    it('should not get the questionnaire, if the user has unknown role', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().resolves(null),
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnairesInteractor
        .getQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(false);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(false);
        });
    });

    it.skip('should not get the questionnaire, if the user has role "Proband" but is not assigned to the right study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .resolves({ study_id: 'Teststudie' }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .rejects(),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnairesInteractor
        .getQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
        });
    });

    it.skip('should not get the questionnaire, if the user has role "Forscher" but is not assigned to the right study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .rejects(),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .getQuestionnaire(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
        });
    });

    it.skip('should get the questionnaire, if the user has role "Proband" and has read access in study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnairesInteractor
        .getQuestionnaire(session, 1, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(result.study_id).to.equal(1);
        });
    });

    it.skip('should get the questionnaire, if the user has role "Forscher" and has read access in study', async function () {
      const pgHelperMock = {
        getQuestionnaire: sinon.stub().withArgs(1).resolves({ study_id: 1 }),
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .getQuestionnaire(session, 1, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getQuestionnaire.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(result.study_id).to.equal(1);
        });
    });
  });

  describe('#getQuestionnaires', function () {
    it('should not get questionnaires, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessesForUser: sinon
          .stub()
          .resolves([{ study_id: 'AStudyId' }]),
        getQuestionnairesByStudyIds: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnairesInteractor
        .getQuestionnaires(session, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessesForUser.calledOnce).to.equal(
            true
          );
          expect(pgHelperMock.getQuestionnairesByStudyIds.calledOnce).to.equal(
            false
          );
        });
    });

    it('should only get questionnaires that are assigned to the users studies', async function () {
      const getQuestionnairesByStudyIdsMock = sinon.stub();
      getQuestionnairesByStudyIdsMock
        .withArgs(['AStudyId'])
        .resolves([{ study_id: 'AStudyId' }]);
      getQuestionnairesByStudyIdsMock
        .withArgs(['AStudyId1', 'AStudyId2'])
        .resolves([{ study_id: 'AStudyId1' }, { study_id: 'AStudyId2' }]);

      const pgHelperMock = {
        getStudyAccessesForUser: sinon
          .stub()
          .withArgs('Testforscher')
          .resolves([{ study_id: 'AStudyId1' }, { study_id: 'AStudyId2' }]),
        getQuestionnairesByStudyIds: getQuestionnairesByStudyIdsMock,
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnairesInteractor
        .getQuestionnaires(session, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessesForUser.calledOnce).to.equal(
            true
          );
          expect(pgHelperMock.getQuestionnairesByStudyIds.calledOnce).to.equal(
            true
          );
          expect(result.length).to.equal(2);
          expect(result[0].study_id).to.equal('AStudyId1');
          expect(result[1].study_id).to.equal('AStudyId2');
        });
    });
  });
});
