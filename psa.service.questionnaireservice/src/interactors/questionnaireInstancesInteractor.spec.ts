/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import sinon from 'sinon';
import { expect } from 'chai';

import { AccessToken, SinonMethodStub } from '@pia/lib-service-core';
import { QuestionnaireInstancesInteractor } from './questionnaireInstancesInteractor';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { messageQueueService } from '../services/messageQueueService';
import { QuestionnaireInstance } from '../models/questionnaireInstance';
import { Questionnaire } from '../models/questionnaire';
import { Question } from '../models/question';

describe('questionnairesInstancesInteractor', () => {
  const sandbox = sinon.createSandbox();

  let getQuestionnaireInstanceWithQuestionnaireStub: SinonMethodStub<
    typeof QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire
  >;
  let getQuestionnaireInstancesWithQuestionnaireAsResearcherStub: SinonMethodStub<
    typeof QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsResearcher
  >;
  let getQuestionnaireInstanceStub: SinonMethodStub<
    typeof QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband
  >;
  let updateQuestionnaireInstanceStub: SinonMethodStub<
    typeof QuestionnaireInstanceRepository.updateQuestionnaireInstance
  >;
  let sendQuestionnaireInstanceReleasedStub: SinonMethodStub<
    typeof messageQueueService.sendQuestionnaireInstanceReleased
  >;

  beforeEach(() => {
    getQuestionnaireInstanceWithQuestionnaireStub = sandbox
      .stub(
        QuestionnaireInstanceRepository,
        'getQuestionnaireInstanceWithQuestionnaire'
      )
      .resolves();
    getQuestionnaireInstancesWithQuestionnaireAsResearcherStub = sandbox
      .stub(
        QuestionnaireInstanceRepository,
        'getQuestionnaireInstancesWithQuestionnaireAsResearcher'
      )
      .resolves();
    getQuestionnaireInstanceStub = sandbox
      .stub(
        QuestionnaireInstanceRepository,
        'getQuestionnaireInstanceForProband'
      )
      .resolves();
    updateQuestionnaireInstanceStub = sandbox
      .stub(QuestionnaireInstanceRepository, 'updateQuestionnaireInstance')
      .resolves();
    sendQuestionnaireInstanceReleasedStub = sandbox
      .stub(messageQueueService, 'sendQuestionnaireInstanceReleased')
      .resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getQuestionnaireInstance()', () => {
    it('should not get the qi, if the user has unknown role', async () => {
      // Arrange
      getQuestionnaireInstanceWithQuestionnaireStub.resolves(undefined);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:NoValidRole'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
        session,
        1
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get the qi, if the user has role "Proband" but the qi is not for him', async () => {
      // Arrange
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves(
        createQuestionnaireInstance({
          user_id: 'NotTheTestProband',
          questionnaire: createQuestionnaire({ questions: [createQuestion()] }),
        })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
        session,
        1
      )
        .catch((err) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(err.message).to.equal(
            'Could not get questionnaire instance, because user has no access'
          );
        })
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
        });
    });

    it('should not get the qi, if the user has role "Proband" but the qi is inactice', async () => {
      // Arrange
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves(
        createQuestionnaireInstance({
          user_id: 'Testproband',
          status: 'inactive',
          questionnaire: createQuestionnaire({ questions: [createQuestion()] }),
        })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
        session,
        1
      )
        .catch((err) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(err.message).to.equal(
            'Could not get questionnaire instance, because user has no access'
          );
        })
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
        });
    });

    it('should not get the qi, if the user has role "Forscher" but is not assigned to the study', async () => {
      // Arrange
      getQuestionnaireInstanceWithQuestionnaireStub
        .withArgs(1)
        .resolves(createQuestionnaireInstance({ study_id: 'teststudy' }));
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['otherStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
        session,
        1
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstanceWithQuestionnaireStub.callCount
          ).to.equal(1);
        });
    });

    it('should get the qi, if the user has role "Proband" and the qi is for him', async () => {
      // Arrange
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves(
        createQuestionnaireInstance({
          id: 1,
          user_id: 'Testproband',
          questionnaire: createQuestionnaire({ questions: [createQuestion()] }),
        })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      // Act
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
          session,
          1
        );

      // Assert
      expect(getQuestionnaireInstanceWithQuestionnaireStub.calledOnce).to.equal(
        true
      );
      expect(result.id).to.equal(1);
    });

    it('should get the qi, if the user has role "Forscher" and has read access in study', async () => {
      // Arrange
      getQuestionnaireInstanceWithQuestionnaireStub.withArgs(1).resolves(
        createQuestionnaireInstance({
          id: 1,
          study_id: 'teststudy',
          questionnaire: createQuestionnaire({ questions: [createQuestion()] }),
        })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['teststudy'],
      });

      // Act
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
          session,
          1
        );

      // Assert
      expect(getQuestionnaireInstanceWithQuestionnaireStub.callCount).to.equal(
        1
      );
      expect(result.id).to.equal(1);
    });
  });

  describe('getQuestionnaireInstances()', () => {
    it('should not get qis, if the user has unknown role', async () => {
      // Arrange
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([
        createQuestionnaireInstance(),
      ]);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:NoValidRole'],
        username: 'Testforscher',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstances(
        session,
        ['active', 'in_progress', 'released_once', 'released_twice']
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.calledOnce
          ).to.equal(false);
        });
    });

    it('should not get any qIs for a Forscher', async () => {
      // Arrange
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub
        .withArgs('Testproband')
        .resolves([
          createQuestionnaireInstance({ id: 1 }),
          createQuestionnaireInstance({ id: 2 }),
        ]);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstances(
        session,
        ['active', 'in_progress', 'released_once', 'released_twice']
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.calledOnce
          ).to.equal(false);
        });
    });
  });

  describe('getQuestionnaireInstancesForUser()', () => {
    it('should not get qis, if the user has unknown role', async () => {
      // Arrange
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([
        createQuestionnaireInstance(),
      ]);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:NoValidRole'],
        username: 'Testforscher',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstancesForUser(
        session,
        'Testproband'
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get qis, if a Proband tries', async () => {
      // Arrange
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([
        createQuestionnaireInstance(),
      ]);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.getQuestionnaireInstancesForUser(
        session,
        'Testproband'
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(
            getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
          ).to.equal(0);
        });
    });

    it('should not get qis if the Forscher is in no study', async () => {
      // Arrange
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([
        createQuestionnaireInstance(),
      ]);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['teststudy'],
      });

      // Act
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstancesForUser(
          session,
          'Testproband'
        );

      // Assert
      expect(
        getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
      ).to.equal(1);
      expect(result.length).to.equal(0);
    });

    it('should resolve with correct qI', async () => {
      // Arrange
      getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.resolves([
        createQuestionnaireInstance({ study_id: 'AStudyId' }),
      ]);
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['AStudyId'],
      });

      // Act
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstancesForUser(
          session,
          'Testproband'
        );

      // Assert
      expect(
        getQuestionnaireInstancesWithQuestionnaireAsResearcherStub.callCount
      ).to.equal(1);
      expect(result.length).to.equal(1);
      expect(result[0]?.study_id).to.equal('AStudyId');
    });
  });

  describe('updateQuestionnaireInstance()', () => {
    beforeEach(() => {
      sendQuestionnaireInstanceReleasedStub.resolves();
    });

    it('should not update the qi, if the user has unknown role', async () => {
      // Arrange
      getQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'active' })
      );
      updateQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'released_once' })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:NoValidRole'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
        session,
        1,
        'released_once',
        0,
        0
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Proband" but the qi is not for him', async () => {
      // Arrange
      getQuestionnaireInstanceStub.rejects();
      updateQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'released_once' })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
        session,
        1,
        'released_once',
        0,
        0
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Proband" but the qi has status inactive', async () => {
      // Arrange
      getQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({
          status: 'inactive',
          user_id: 'Testproband',
        })
      );
      updateQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'released_once' })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
        session,
        1,
        'released_once',
        0,
        0
      )
        .catch(console.log)
        .finally(() => {
          // Assert
          expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Proband", the qi has status released_once and new status is active', async () => {
      // Arrange
      getQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({
          status: 'released_once',
          user_id: 'Testproband',
        })
      );
      updateQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'active' })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
        session,
        1,
        'active',
        0,
        0
      )
        .catch(console.log)
        .finally(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(1);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should not update the qi, if the user has role "Forscher"', async () => {
      // Arrange
      getQuestionnaireInstanceStub
        .withArgs(1)
        .resolves(
          createQuestionnaireInstance({ study_id: '1', status: 'inactive' })
        );
      updateQuestionnaireInstanceStub.rejects();
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Forscher'],
        username: 'Testforscher',
        studies: ['TestStudy'],
      });

      await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
        session,
        1,
        'active',
        0,
        0
      )
        .catch(console.log)
        .finally(() => {
          expect(getQuestionnaireInstanceStub.callCount).to.equal(0);
          expect(updateQuestionnaireInstanceStub.callCount).to.equal(0);
        });
    });

    it('should update the qi, if the user has role "Proband", old status is active, new status is released_once', async () => {
      // Arrange
      getQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({
          status: 'active',
          user_id: 'Testproband',
        })
      );
      updateQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'released_once' })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      // Act
      const result =
        await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
          session,
          1,
          'released_once',
          0,
          0
        );

      // Assert
      expect(getQuestionnaireInstanceStub.calledOnce).to.equal(true);
      expect(updateQuestionnaireInstanceStub.calledOnce).to.equal(true);
      expect(result.status).to.equal('released_once');
    });

    it('should update the qi, if the user has role "Proband", old status is released_once, new status is released_twice', async () => {
      // Arrange
      getQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({
          status: 'released_once',
          user_id: 'Testproband',
        })
      );
      updateQuestionnaireInstanceStub.resolves(
        createQuestionnaireInstance({ status: 'released_twice' })
      );
      const session: AccessToken = createDecodedToken({
        scope: ['realm:Proband'],
        username: 'Testproband',
        studies: ['TestStudy'],
      });

      // Act
      const result =
        await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
          session,
          1,
          'released_twice',
          0,
          0
        );

      // Assert
      expect(getQuestionnaireInstanceStub.calledOnce).to.equal(true);
      expect(updateQuestionnaireInstanceStub.calledOnce).to.equal(true);
      expect(result.status).to.equal('released_twice');
    });
  });

  function createQuestionnaireInstance(
    overwrite: Partial<QuestionnaireInstance> = {}
  ): QuestionnaireInstance {
    return {
      id: 1,
      user_id: 'TEST-1234567890',
      study_id: 'Test-Study',
      status: 'active',
      date_of_issue: new Date(),
      date_of_release_v1: null,
      date_of_release_v2: null,
      release_version: null,
      cycle: 0,
      notifications_scheduled: true,
      progress: 0,
      questionnaire_id: 1,
      questionnaire_version: 1,
      questionnaire_name: 'Test Questionnaire',
      questionnaire: createQuestionnaire(),
      ...overwrite,
    };
  }

  function createDecodedToken(overwrites: Partial<AccessToken>): AccessToken {
    return {
      username: '',
      studies: [],
      scope: [],
      locale: 'de-De',
      ...overwrites,
    };
  }

  function createQuestionnaire(
    overwrite: Partial<Questionnaire> = {}
  ): Questionnaire {
    return {
      id: 1,
      questions: [createQuestion()],
      condition: null,
      type: 'for_probands',
      ...overwrite,
    } as unknown as Questionnaire;
  }

  function createQuestion(overwrite: Partial<Question> = {}): Question {
    return {
      id: 9999,
      answer_options: [],
      condition: null,
      questionnaire_id: 1,
      questionnaire_version: 1,
      text: '',
      position: 1,
      is_mandatory: true,
      ...overwrite,
    };
  }
});
