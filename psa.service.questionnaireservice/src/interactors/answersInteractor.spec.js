/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const sinon = require('sinon');
const expect = require('chai').expect;
const sandbox = sinon.createSandbox();
const {
  QuestionnaireInstanceRepository,
} = require('../repositories/questionnaireInstanceRepository');
const pgHelper = require('../services/postgresqlHelper');

const { AnswersInteractor } = require('./answersInteractor');
const answerTypesValidator = require('../services/answerTypesValidator');

describe('answersInteractor', function () {
  afterEach(() => {
    sandbox.restore();
  });
  describe('#getAnswers', function () {
    it('should not get the answers, if the user has unknown role', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband' });
      const getAnswersForProbandStub = sandbox
        .stub(pgHelper, 'getAnswersForProband')
        .resolves(null);
      const getAnswersForForscherStub = sandbox
        .stub(pgHelper, 'getAnswersForForscher')
        .resolves(null);

      const session = {
        scope: ['realm:NoValidRole'],
        username: 'Testproband',
      };
      await AnswersInteractor.getAnswers(session, 1).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
        expect(getAnswersForProbandStub.callCount).to.equal(0);
        expect(getAnswersForForscherStub.callCount).to.equal(0);
      });
    });

    it('should not get the answers, if the user has role "Proband" but its not his QI', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'NotTestproband' });
      const getAnswersForProbandStub = sandbox
        .stub(pgHelper, 'getAnswersForProband')
        .resolves(null);
      const getAnswersForForscherStub = sandbox
        .stub(pgHelper, 'getAnswersForForscher')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.getAnswers(session, 1).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(getAnswersForProbandStub.callCount).to.equal(0);
        expect(getAnswersForForscherStub.callCount).to.equal(0);
      });
    });

    it('should not get the answers, if the user has role "Forscher" but is not assigned to the study', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForResearcher'
        )
        .resolves({ study_id: 1, status: 'released_once' });
      const getAnswersForProbandStub = sandbox
        .stub(pgHelper, 'getAnswersForProband')
        .resolves(null);
      const getAnswersForForscherStub = sandbox
        .stub(pgHelper, 'getAnswersForForscher')
        .resolves(null);

      const session = {
        scope: ['realm:Forscher'],
        username: 'Testforscher',
      };
      await AnswersInteractor.getAnswers(session, 1).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(getAnswersForProbandStub.callCount).to.equal(0);
        expect(getAnswersForForscherStub.callCount).to.equal(0);
      });
    });

    it('should not get the answers, if the user has role "Forscher" but the QI has status "active"', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForResearcher'
        )
        .resolves({ study_id: 1, status: 'active' });
      const getAnswersForProbandStub = sandbox
        .stub(pgHelper, 'getAnswersForProband')
        .resolves(null);
      const getAnswersForForscherStub = sandbox
        .stub(pgHelper, 'getAnswersForForscher')
        .resolves(null);

      const session = {
        scope: ['realm:Forscher'],
        username: 'Testforscher',
      };
      await AnswersInteractor.getAnswers(session, 1).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(getAnswersForProbandStub.callCount).to.equal(0);
        expect(getAnswersForForscherStub.callCount).to.equal(0);
      });
    });

    it('should get the answers, if the user has role "Proband" and the QI is assigned to him', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband' });
      const getAnswersForProbandStub = sandbox
        .stub(pgHelper, 'getAnswersForProband')
        .resolves([{ question_id: 1 }]);
      const getAnswersForForscherStub = sandbox
        .stub(pgHelper, 'getAnswersForForscher')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.getAnswers(session, 1).then((result) => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(getAnswersForProbandStub.callCount).to.equal(1);
        expect(getAnswersForForscherStub.callCount).to.equal(0);
        expect(result[0].question_id).to.equal(1);
      });
    });

    it('should get the answers, if the user has role "Forscher" and QI has status released_once', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForResearcher'
        )
        .resolves({ study_id: 'Study1', status: 'released_once' });
      const getAnswersForProbandStub = sandbox
        .stub(pgHelper, 'getAnswersForProband')
        .resolves(null);
      const getAnswersForForscherStub = sandbox
        .stub(pgHelper, 'getAnswersForForscher')
        .resolves([{ question_id: 1 }]);

      const session = {
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['Study1'],
      };
      await AnswersInteractor.getAnswers(session, 1).then((result) => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(getAnswersForProbandStub.callCount).to.equal(0);
        expect(getAnswersForForscherStub.callCount).to.equal(1);
        expect(result[0].question_id).to.equal(1);
      });
    });
  });

  describe('#createOrUpdateAnswers', function () {
    it('should not update the answers, if the user has unknown role', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband' });
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves(null);

      const session = {
        scope: ['realm:NoValidRole'],
        username: 'Testproband',
      };
      await AnswersInteractor.createOrUpdateAnswers(session, 1, {}).catch(
        () => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
          expect(createOrUpdateAnswersStub.callCount).to.equal(0);
        }
      );
    });

    it('should not update the answers, if the user has role Forscher', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband' });
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves(null);

      const session = {
        scope: ['realm:Forscher'],
        username: 'Testforscher',
      };
      await AnswersInteractor.createOrUpdateAnswers(session, 1, {}).catch(
        () => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
          expect(createOrUpdateAnswersStub.callCount).to.equal(0);
        }
      );
    });

    it('should not update the answers, if the user has role "Proband" but its not his QI', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'NotTestproband' });
      const validateFileAndImageStub = sandbox
        .stub(answerTypesValidator, 'isFileContentAllowed')
        .resolves(true);
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      try {
        await AnswersInteractor.createOrUpdateAnswers(session, 1, []);
      } catch (e) {
        console.log(e);
      }
      expect(validateFileAndImageStub.callCount).to.equal(1);
      expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
      expect(createOrUpdateAnswersStub.callCount).to.equal(0);
    });

    it('should not update the answers, if the user has role "Proband" but QI has status inactive', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'inactive' });
      const validateFileAndImageStub = sandbox
        .stub(answerTypesValidator, 'isFileContentAllowed')
        .resolves(true);
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      try {
        await AnswersInteractor.createOrUpdateAnswers(session, 1, []);
      } catch (e) {
        console.log(e);
      }
      expect(validateFileAndImageStub.callCount).to.equal(1);
      expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
      expect(createOrUpdateAnswersStub.callCount).to.equal(0);
    });

    it('should not update the answers, if the user has role "Proband" but QI has status released_twice', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'released_twice' });
      const validateFileAndImageStub = sandbox
        .stub(answerTypesValidator, 'isFileContentAllowed')
        .resolves(true);
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      try {
        await AnswersInteractor.createOrUpdateAnswers(session, 1, []);
      } catch (e) {
        console.log(e);
      }
      expect(validateFileAndImageStub.callCount).to.equal(1);
      expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
      expect(createOrUpdateAnswersStub.callCount).to.equal(0);
    });

    it('should update the answers, if the user has role "Proband" and the QI is assigned to him with status active', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'active' });
      const validateFileAndImageStub = sandbox
        .stub(answerTypesValidator, 'isFileContentAllowed')
        .resolves(true);
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves([{ question_id: 1 }]);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      const result = await AnswersInteractor.createOrUpdateAnswers(
        session,
        1,
        []
      );
      expect(validateFileAndImageStub.callCount).to.equal(1);
      expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
      expect(createOrUpdateAnswersStub.callCount).to.equal(1);
      expect(result[0].question_id).to.equal(1);
    });

    it('should update the answers, if the user has role "Proband" and the QI is assigned to him with status released_once', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'released_once' });
      const validateFileAndImageStub = sandbox
        .stub(answerTypesValidator, 'isFileContentAllowed')
        .resolves(true);
      const createOrUpdateAnswersStub = sandbox
        .stub(pgHelper, 'createOrUpdateAnswers')
        .resolves([{ question_id: 1 }]);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      const result = await AnswersInteractor.createOrUpdateAnswers(
        session,
        1,
        {}
      );
      expect(validateFileAndImageStub.callCount).to.equal(1);
      expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
      expect(createOrUpdateAnswersStub.callCount).to.equal(1);
      expect(result[0].question_id).to.equal(1);
    });
  });

  describe('#deleteAnswer', function () {
    it('should not delete the answer, if the user has unknown role', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:NoValidRole'],
        username: 'Testproband',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
        expect(deleteAnswerStub.callCount).to.equal(0);
      });
    });

    it('should not delete the answer, if the user has role Forscher', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:Forscher'],
        username: 'Testforscher',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
        expect(deleteAnswerStub.callCount).to.equal(0);
      });
    });

    it('should not delete the answer, if the user has role "Proband" but its not his QI', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'NotTestproband' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(deleteAnswerStub.callCount).to.equal(0);
      });
    });

    it('should not delete the answer, if the user has role "Proband" but QI has status inactive', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'inactive' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(deleteAnswerStub.callCount).to.equal(0);
      });
    });

    it('should not delete the answer, if the user has role "Proband" but QI has status released_twice', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'released_twice' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).catch(() => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(deleteAnswerStub.callCount).to.equal(0);
      });
    });

    it('should delete the answer, if the user has role "Proband" and the QI is assigned to him with status active', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'active' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).then((result) => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(deleteAnswerStub.callCount).to.equal(1);
        expect(result).to.equal(null);
      });
    });

    it('should delete the answer, if the user has role "Proband" and the QI is assigned to him with status released_once', async function () {
      const getQuestionnaireInstanceStub = sandbox
        .stub(
          QuestionnaireInstanceRepository,
          'getQuestionnaireInstanceForProband'
        )
        .resolves({ user_id: 'Testproband', status: 'released_once' });
      const deleteAnswerStub = sandbox
        .stub(pgHelper, 'deleteAnswer')
        .resolves(null);

      const session = {
        scope: ['realm:Proband'],
        username: 'Testproband',
      };
      await AnswersInteractor.deleteAnswer(session, 1, {}).then((result) => {
        expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
        expect(deleteAnswerStub.callCount).to.equal(1);
        expect(result).to.equal(null);
      });
    });
  });
});
