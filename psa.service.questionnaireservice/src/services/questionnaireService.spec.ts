/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SinonMethodStub } from '@pia/lib-service-core';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { db } from '../db';
import { Questionnaire } from '../models/questionnaire';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { QuestionnaireRepository } from '../repositories/questionnaireRepository';
import { QuestionnaireService } from './questionnaireService';

chai.use(sinonChai);

describe('QuestionnaireService', () => {
  const sandbox = sinon.createSandbox();

  const questionnaire = createQuestionnaire();
  let deactivateQuestionnaireMock: SinonMethodStub<
    typeof QuestionnaireRepository.deactivateQuestionnaire
  >;
  let getQuestionnaireMock: SinonMethodStub<
    typeof QuestionnaireRepository.getQuestionnaire
  >;
  let deleteQuestionnaireInstancesMock: SinonMethodStub<
    typeof QuestionnaireInstanceRepository.deleteQuestionnaireInstancesByQuestionnaireId
  >;

  beforeEach(() => {
    deactivateQuestionnaireMock = sandbox
      .stub(QuestionnaireRepository, 'deactivateQuestionnaire')
      .resolves();
    getQuestionnaireMock = sandbox
      .stub(QuestionnaireRepository, 'getQuestionnaire')
      .resolves(questionnaire);
    deleteQuestionnaireInstancesMock = sandbox
      .stub(
        QuestionnaireInstanceRepository,
        'deleteQuestionnaireInstancesByQuestionnaireId'
      )
      .resolves();

    sandbox
      .stub(db, 'tx')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake((cb: (t: unknown) => void): void => cb({}));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should delete all active, inactive and in_progress questionnaire instances', async () => {
    // Arrange
    const questionnaireId = 1234;

    // Act
    await QuestionnaireService.deactivateQuestionnaire(questionnaireId, 1);

    // Assert
    expect(deleteQuestionnaireInstancesMock).to.have.been.calledWith(
      questionnaireId,
      1,
      ['active', 'inactive', 'in_progress']
    );
  });

  it('should set active status of questionnaire to false', async () => {
    // Arrange
    const questionnaireId = 1234;

    // Act
    await QuestionnaireService.deactivateQuestionnaire(questionnaireId, 1);

    // Assert
    expect(deactivateQuestionnaireMock).to.have.been.calledWith(
      questionnaireId,
      1
    );
  });

  it('should return the deactivated questionnaire', async () => {
    // Arrange
    const questionnaireId = 1234;

    // Act
    const result = await QuestionnaireService.deactivateQuestionnaire(
      questionnaireId,
      1
    );

    // Assert
    expect(getQuestionnaireMock).to.have.been.calledWith(questionnaireId, 1);
    expect(result).to.equal(questionnaire);
  });

  function createQuestionnaire(): Questionnaire {
    return {
      id: 99999,
      active: false,
      study_id: 'Study1',
      name: 'TestQuestionnaire1',
      custom_name: null,
      no_questions: 2,
      cycle_amount: 0,
      cycle_unit: 'once',
      activate_after_days: 1,
      deactivate_after_days: 0,
      notification_tries: 1,
      notification_title: 'string',
      notification_body_new: 'string',
      notification_body_in_progress: 'string',
      notification_weekday: 'sunday',
      notification_interval: 2,
      notification_interval_unit: 'string',
      activate_at_date: new Date(),
      compliance_needed: false,
      expires_after_days: 14,
      finalises_after_days: 2,
      cycle_per_day: 1,
      cycle_first_hour: 1,
      type: 'for_probands',
      version: 1,
      publish: 'string',
      notify_when_not_filled: false,
      notify_when_not_filled_time: '08:00',
      notify_when_not_filled_day: 3,
      keep_answers: false,
      condition: null,
      created_at: new Date(),
      updated_at: new Date(),
      questions: [],
    };
  }
});
