/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const sinon = require('sinon');
const expect = require('chai').expect;

const sandbox = sinon.createSandbox();

const questionnaireInstancesInteractor = require('./questionnaireInstancesInteractor');
const {
  QuestionnaireInstanceRepository,
} = require('../repositories/questionnaireInstanceRepository');

describe('questionnairesInstancesInteractor', function () {
  let getQuestionnaireInstanceWithQuestionnaireStub;
  let getQuestionnaireInstancesWithQuestionnaireAsResearcherStub;
  let getQuestionnaireInstanceStub;
  let updateQuestionnaireInstanceStub;

  beforeEach(() => {
    getQuestionnaireInstanceWithQuestionnaireStub = sandbox.stub(
      QuestionnaireInstanceRepository,
      'getQuestionnaireInstanceWithQuestionnaire'
    );
    getQuestionnaireInstancesWithQuestionnaireAsResearcherStub = sandbox.stub(
      QuestionnaireInstanceRepository,
      'getQuestionnaireInstancesWithQuestionnaireAsResearcher'
    );
    getQuestionnaireInstanceStub = sandbox.stub(
      QuestionnaireInstanceRepository,
      'getQuestionnaireInstanceForProband'
    );
    updateQuestionnaireInstanceStub = sandbox.stub(
      QuestionnaireInstanceRepository,
      'updateQuestionnaireInstance'
    );
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('#getQuestionnaireInstance', function () {
    it('should not get the qi, if the user has unknown role', async function () {
      getQuestionnaireInstanceWithQuestionnaireStub.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstance(session, 1)
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get the qi, if the user has role "Proband" but the qi is not for him', async function () {
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves({
        user_id: 'NotTheTestProband',
        questionnaire: { type: 'for_probands', questions: [{}] },
      });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstance(session, 1)
        .then()
        .catch((err) => {
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
          expect(err.message).to.equal(
            'Could not get questionnaire instance, because user has no access'
          );
        });
    });

    it('should not get the qi, if the user has role "Proband" but the qi is inactice', async function () {
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves({
        user_id: 'Testproband',
        status: 'inactive',
        questionnaire: { type: 'for_probands', questions: [{}] },
      });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstance(session, 1)
        .then()
        .catch((err) => {
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
          expect(err.message).to.equal(
            'Could not get questionnaire instance, because user has no access'
          );
        });
    });

    it('should not get the qi, if the user has role "Forscher" but is not assigned to the study', async function () {
      getQuestionnaireInstanceWithQuestionnaireStub
        .withArgs(1)
        .resolves({ study_id: 'teststudy' });

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['otherStudy'],
      };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstance(session, 1)
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
        });
    });

    it('should get the qi, if the user has role "Proband" and the qi is for him', async function () {
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves({
        id: 1,
        user_id: 'Testproband',
        questionnaire: { type: 'for_probands', questions: [{}] },
      });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstance(session, 1)
        .then((result) => {
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.calledOnce
          ).to.equal(true);
          expect(result.id).to.equal(1);
        });
    });

    it('should get the qi, if the user has role "Forscher" and has read access in study', async function () {
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves({
        id: 1,
        study_id: 'teststudy',
        questionnaire: { questions: [{}] },
      });

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['teststudy'],
      };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstance(session, 1)
        .then((result) => {
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
          expect(result.id).to.equal(1);
        });
    });
  });

  describe('#getQuestionnaireInstances', function () {
    it('should not get qis, if the user has unknown role', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([1]);

      const session = { id: 1, role: 'NoValidRole', username: 'Testforscher' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstances(session)
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.calledOnce
          ).to.equal(false);
        });
    });

    it('should not get any qIs for a Forscher', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub
        .withArgs('Testproband')
        .resolves([{ id: 1 }, { id: 2 }]);

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstances(session)
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.calledOnce
          ).to.equal(false);
        });
    });
  });

  describe('#getQuestionnaireInstancesForUser', function () {
    it('should not get qis, if the user has unknown role', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([1]);

      const session = { id: 1, role: 'NoValidRole', username: 'Testforscher' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstancesForUser(session, 'Testproband')
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get qis, if a Proband tries', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([1]);

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstancesForUser(session, 'Testproband')
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get qis if the user is in no study', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([1]);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['otherstudy'],
      };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstancesForUser(session, 'Testproband')
        .then()
        .catch(() => {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get qis if the Forscher is in no study', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([1]);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['teststudy'],
      };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstancesForUser(session, 'Testproband')
        .then(function (result) {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(1);
          expect(result.length).to.equal(0);
        });
    });

    it('should resolve with correct qI', async function () {
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([
        { study_id: 'AStudyId' },
      ]);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['AStudyId'],
      };
      await questionnaireInstancesInteractor
        .getQuestionnaireInstancesForUser(session, 'Testproband')
        .then(function (result) {
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(1);
          expect(result.length).to.equal(1);
          expect(result[0].study_id).to.equal('AStudyId');
        });
    });
  });

  describe('#updateQuestionnaireInstance', function () {
    it('should not update the qi, if the user has unknown role', async function () {
      getQuestionnaireInstanceStub.resolves({ status: 'active' }),
        updateQuestionnaireInstanceStub.resolves({ status: 'released_once' });

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'released_once')
        .then()
        .catch(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Proband" but the qi is not for him', async function () {
      getQuestionnaireInstanceStub.rejects(),
        updateQuestionnaireInstanceStub.resolves({ status: 'released_once' });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'released_once')
        .then()
        .catch(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Proband" but the qi has status inactive', async function () {
      getQuestionnaireInstanceStub.resolves({
        status: 'inactive',
        user_id: 'Testproband',
      }),
        updateQuestionnaireInstanceStub.resolves({ status: 'released_once' });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'released_once')
        .then()
        .catch(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Proband", the qi has status released_once and new status is active', async function () {
      getQuestionnaireInstanceStub.resolves({
        status: 'released_once',
        user_id: 'Testproband',
      }),
        updateQuestionnaireInstanceStub.resolves({ status: 'active' });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'active')
        .then()
        .catch(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Forscher"', async function () {
      getQuestionnaireInstanceStub
        .withArgs(1)
        .resolves({ study_id: 1, status: 'inactive' }),
        updateQuestionnaireInstanceStub.rejects();

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'active')
        .then()
        .catch(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should update the qi, if the user has role "Proband", old status is active, new status is released_once', async function () {
      getQuestionnaireInstanceStub.resolves({
        status: 'active',
        user_id: 'Testproband',
      }),
        updateQuestionnaireInstanceStub.resolves({ status: 'released_once' });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'released_once')
        .then((result) => {
          expect(getQuestionnaireInstanceStub.calledOnce).to.equal(true);
          expect(updateQuestionnaireInstanceStub.calledOnce).to.equal(true);
          expect(result.status).to.equal('released_once');
        });
    });

    it('should update the qi, if the user has role "Proband", old status is released_once, new status is released_twice', async function () {
      getQuestionnaireInstanceStub.resolves({
        status: 'released_once',
        user_id: 'Testproband',
      }),
        updateQuestionnaireInstanceStub.resolves({ status: 'released_twice' });

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await questionnaireInstancesInteractor
        .updateQuestionnaireInstance(session, 1, 'released_twice')
        .then((result) => {
          expect(getQuestionnaireInstanceStub.calledOnce).to.equal(true);
          expect(updateQuestionnaireInstanceStub.calledOnce).to.equal(true);
          expect(result.status).to.equal('released_twice');
        });
    });
  });
});
