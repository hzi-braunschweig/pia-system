/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const pgHelper = require('../services/postgresqlHelper');
const {
  QuestionnaireRepository,
} = require('../repositories/questionnaireRepository');
const { QuestionnaireService } = require('../services/questionnaireService');
const { QuestionnairesInteractor } = require('./questionnairesInteractor');
const {
  complianceserviceClient,
} = require('../clients/complianceserviceClient');

const expect = chai.expect;
const sandbox = sinon.createSandbox();
chai.use(sinonChai);

describe('questionnairesInteractor', function () {
  let pgHelperMock;
  let questionnaireRepoMock;
  let hasAgreedToComplianceMock;

  beforeEach(() => {
    pgHelperMock = sandbox.stub(pgHelper);
    sandbox.stub(QuestionnaireService, 'deactivateQuestionnaire');
    hasAgreedToComplianceMock = sandbox.stub(
      complianceserviceClient,
      'hasAgreedToCompliance'
    );
    questionnaireRepoMock = {
      getQuestionnaire: sandbox.stub(
        QuestionnaireRepository,
        'getQuestionnaire'
      ),

      getQuestionnairesByStudyIds: sandbox.stub(
        QuestionnaireRepository,
        'getQuestionnairesByStudyIds'
      ),
    };
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('#deleteQuestionnaire', function () {
    it('should not delete the questionnaire, if the user has unknown role', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testproband')
        .resolves({ access_level: 'write' });
      pgHelperMock.deleteQuestionnaire.withArgs(1).resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await QuestionnairesInteractor.deleteQuestionnaire(session, 1).catch(
        console.log
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.not.been.called;
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.deleteQuestionnaire).to.have.not.been.called;
    });

    it('should not delete the questionnaire, if the user has role "Proband"', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testproband')
        .resolves({ access_level: 'write' });
      pgHelperMock.deleteQuestionnaire.withArgs(1).resolves(null);

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await QuestionnairesInteractor.deleteQuestionnaire(session, 1).catch(
        console.log
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.not.been.called;
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.deleteQuestionnaire).to.have.not.been.called;
    });

    it('should not delete the questionnaire, if the user has role "Forscher" but is not assigned to the right study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testforscher')
        .rejects();
      pgHelperMock.deleteQuestionnaire.withArgs(1).resolves(null);
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study2'],
      };
      await QuestionnairesInteractor.deleteQuestionnaire(session, 1).catch(
        console.log
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.deleteQuestionnaire).to.have.not.been.called;
    });

    it('should not delete the questionnaire, if the user has role "Forscher" but only has read access in study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1', active: true });
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testforscher')
        .resolves({ access_level: 'read' });
      pgHelperMock.deleteQuestionnaire.withArgs(1).resolves(null);
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      await QuestionnairesInteractor.deleteQuestionnaire(session, 1).catch(
        console.log
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledOnce;
      expect(pgHelperMock.deleteQuestionnaire).to.have.not.been.called;
    });

    it('should delete the questionnaire, if the user has role "Forscher" and has write access in study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1', active: true });
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testforscher')
        .resolves({ access_level: 'write' });
      pgHelperMock.deleteQuestionnaire.withArgs(1).resolves(null);
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      await QuestionnairesInteractor.deleteQuestionnaire(session, 1);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledOnce;
      expect(pgHelperMock.deleteQuestionnaire).to.have.been.calledOnce;
    });
  });

  describe('#createQuestionnaire', function () {
    it('should not create the questionnaire, if the user has unknown role', async function () {
      pgHelperMock.getStudyAccessForUser.resolves({ access_level: 'write' });
      pgHelperMock.insertQuestionnaire.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await QuestionnairesInteractor.createQuestionnaire(session, {}).catch(
        console.log
      );
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.insertQuestionnaire).to.have.not.been.called;
    });

    it('should not create the questionnaire, if the user has role "Proband"', async function () {
      pgHelperMock.getStudyAccessForUser.resolves({ access_level: 'write' });
      pgHelperMock.insertQuestionnaire.resolves(null);

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await QuestionnairesInteractor.createQuestionnaire(session, {}).catch(
        console.log
      );
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.insertQuestionnaire).to.have.not.been.called;
    });

    it('should not create the questionnaire, if the user has role "Forscher" but is not assigned to the right study', async function () {
      pgHelperMock.insertQuestionnaire.resolves(null);
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      await QuestionnairesInteractor.createQuestionnaire(session, {
        study_id: 'Study2',
      }).catch(console.log);
      expect(pgHelperMock.getStudyAccessForUser).to.not.have.been.called;
      expect(pgHelperMock.insertQuestionnaire).to.not.have.been.called;
    });

    it('should not create the questionnaire, if the user has role "Forscher" but only has read access in study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testforscher')
        .resolves({ access_level: 'read' });
      pgHelperMock.insertQuestionnaire.resolves(null);
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      await QuestionnairesInteractor.createQuestionnaire(session, {
        study_id: 'Study1',
      }).catch(console.log);
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledOnce;
      expect(pgHelperMock.insertQuestionnaire).to.have.not.been.called;
    });

    it('should create the questionnaire, if the user has role "Forscher" and has write access in study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1', 'Testforscher')
        .resolves({ access_level: 'write' });
      pgHelperMock.insertQuestionnaire
        .withArgs({ study_id: 'Study1' })
        .resolves({ study_id: 'Study1', id: 1 });
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      const newQuestionnaire =
        await QuestionnairesInteractor.createQuestionnaire(session, {
          study_id: 'Study1',
        });
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledOnce;
      expect(pgHelperMock.insertQuestionnaire).to.have.been.calledOnce;
      expect(newQuestionnaire.id).to.equal(1);
    });
  });

  describe('#updateQuestionnaire', function () {
    it('should not update the questionnaire, if the user has unknown role', async function () {
      pgHelperMock.getStudyAccessForUser
        .onCall(0)
        .resolves({ access_level: 'write' })
        .onCall(1)
        .resolves({ access_level: 'write' });

      questionnaireRepoMock.getQuestionnaire.resolves({ study_id: 'Study1' });
      pgHelperMock.updateQuestionnaire.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await QuestionnairesInteractor.updateQuestionnaire(
        session,
        1,
        1,
        {}
      ).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.not.been.called;
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.updateQuestionnaire).to.have.not.been.called;
    });

    it('should not update the questionnaire, if the user has role "Proband"', async function () {
      pgHelperMock.getStudyAccessForUser
        .onCall(0)
        .resolves({ access_level: 'write' })
        .onCall(1)
        .resolves({ access_level: 'write' });

      questionnaireRepoMock.getQuestionnaire.resolves({ study_id: 'Study1' });
      pgHelperMock.updateQuestionnaire.resolves(null);

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await QuestionnairesInteractor.updateQuestionnaire(
        session,
        1,
        1,
        {}
      ).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.not.been.called;
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.updateQuestionnaire).to.have.not.been.called;
    });

    it('should not update the questionnaire, if the user has role "Forscher" but is not assigned to the old study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1')
        .rejects()
        .withArgs('Study2')
        .resolves({ access_level: 'write' });

      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });
      pgHelperMock.updateQuestionnaire.resolves(null);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study2'],
      };
      await QuestionnairesInteractor.updateQuestionnaire(session, 1, 1, {
        study_id: 'Study2',
      }).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.not.been.called;
      expect(pgHelperMock.updateQuestionnaire).to.have.not.been.called;
    });

    it('should not update the questionnaire, if the user has role "Forscher" but is not assigned to the new study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1')
        .resolves({ access_level: 'write' })
        .withArgs('Study2')
        .rejects();

      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1', active: true });
      pgHelperMock.updateQuestionnaire.resolves(null);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      await QuestionnairesInteractor.updateQuestionnaire(session, 1, 1, {
        study_id: 'Study2',
      }).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledOnce;
      expect(pgHelperMock.updateQuestionnaire).to.have.not.been.called;
    });

    it('should not update the questionnaire, if the user has role "Forscher" but only has read access in old study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1')
        .resolves({ access_level: 'read' })
        .withArgs('Study2')
        .resolves({ access_level: 'write' });

      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1', active: true });
      pgHelperMock.updateQuestionnaire.resolves(null);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1', 'Study2'],
      };
      await QuestionnairesInteractor.updateQuestionnaire(session, 1, 1, {
        study_id: 'Study2',
      }).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledOnce;
      expect(pgHelperMock.updateQuestionnaire).to.have.not.been.called;
    });

    it('should not update the questionnaire, if the user has role "Forscher" but only has read access in new study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1')
        .resolves({ access_level: 'write' })
        .withArgs('Study2')
        .resolves({ access_level: 'read' });

      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1', active: true });
      pgHelperMock.updateQuestionnaire.resolves(null);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1', 'Study2'],
      };
      await QuestionnairesInteractor.updateQuestionnaire(session, 1, 1, {
        study_id: 'Study2',
      }).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser).to.have.been.calledTwice;
      expect(pgHelperMock.updateQuestionnaire).to.have.not.been.called;
    });

    it('should update the questionnaire, if the user has role "Forscher" and has write access in old and new study', async function () {
      pgHelperMock.getStudyAccessForUser
        .withArgs('Study1')
        .resolves({ access_level: 'write' })
        .withArgs('Study2')
        .resolves({ access_level: 'write' });

      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1', active: true });
      pgHelperMock.updateQuestionnaire
        .withArgs({ study_id: 'Study2', active: true }, 1)
        .resolves({ study_id: 'Study2' });

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1', 'Study2'],
      };
      const questionnaire = await QuestionnairesInteractor.updateQuestionnaire(
        session,
        1,
        1,
        { study_id: 'Study2', active: true }
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(2);
      expect(pgHelperMock.updateQuestionnaire).to.have.been.calledOnce;
      expect(questionnaire.study_id).to.equal('Study2');
    });
  });

  describe('#getQuestionnaire', function () {
    it('should not get the questionnaire, if the user has unknown role', async function () {
      questionnaireRepoMock.getQuestionnaire.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      const questionnaire = await QuestionnairesInteractor.getQuestionnaire(
        session,
        1
      ).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.not.been.called;
      expect(questionnaire).to.be.undefined;
    });

    it('should not get the questionnaire, if the user has role "Proband" but is not assigned to the right study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });

      const session = {
        id: 1,
        role: 'Proband',
        username: 'Testproband',
        groups: ['Study2'],
      };
      const questionnaire = await QuestionnairesInteractor.getQuestionnaire(
        session,
        1
      ).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(questionnaire).to.be.undefined;
    });

    it('should not get the questionnaire, if the user has role "Forscher" but is not assigned to the right study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });
      pgHelperMock.getStudyAccessForUser.withArgs(1, 'Testforscher').rejects();

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: [],
      };
      const questionnaire = await QuestionnairesInteractor.getQuestionnaire(
        session,
        1
      ).catch(console.log);
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(questionnaire).to.be.undefined;
    });

    it('should get the questionnaire, if the user has role "Proband" and has read access in study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ compliance_needed: true, study_id: 'Study1' });
      hasAgreedToComplianceMock.resolves(true);

      const session = {
        id: 1,
        role: 'Proband',
        username: 'Testproband',
        groups: ['Study1'],
      };
      const questionnaire = await QuestionnairesInteractor.getQuestionnaire(
        session,
        1
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(questionnaire.study_id).to.equal('Study1');
    });

    it('should get the questionnaire, if the user has role "Forscher" and has read access in study', async function () {
      questionnaireRepoMock.getQuestionnaire
        .withArgs(1)
        .resolves({ study_id: 'Study1' });

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      const questionnaire = await QuestionnairesInteractor.getQuestionnaire(
        session,
        1
      );
      expect(questionnaireRepoMock.getQuestionnaire).to.have.been.calledOnce;
      expect(questionnaire.study_id).to.equal('Study1');
    });
  });

  describe('#getQuestionnaires', function () {
    it('should not get questionnaires, if the user has unknown role', async function () {
      questionnaireRepoMock.getQuestionnairesByStudyIds.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await QuestionnairesInteractor.getQuestionnaires(session).catch(
        console.log
      );
      expect(questionnaireRepoMock.getQuestionnairesByStudyIds).to.have.not.been
        .called;
    });

    it('should only get questionnaires that are assigned to the users studies', async function () {
      questionnaireRepoMock.getQuestionnairesByStudyIds
        .withArgs(['AStudyId'])
        .resolves([{ study_id: 'AStudyId' }])
        .withArgs(['AStudyId1', 'AStudyId2'])
        .resolves([{ study_id: 'AStudyId1' }, { study_id: 'AStudyId2' }]);
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['AStudyId1', 'AStudyId2'],
      };
      const result = await QuestionnairesInteractor.getQuestionnaires(session);
      expect(questionnaireRepoMock.getQuestionnairesByStudyIds).to.have.been
        .calledOnce;
      expect(result.length).to.equal(2);
      expect(result[0].study_id).to.equal('AStudyId1');
      expect(result[1].study_id).to.equal('AStudyId2');
    });
  });
});
