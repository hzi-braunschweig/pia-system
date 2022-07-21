/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { QuestionnaireInstance } from '../../src/entities/questionnaireInstance';
import { AnswerOption } from '../../src/entities/answerOption';
import { AnswerType } from '../../src/models/answerOption';
import { Question } from '../../src/entities/question';
import { Questionnaire } from '../../src/entities/questionnaire';

function createAnswerOption(
  overwrite: Partial<AnswerOption> = {}
): AnswerOption {
  return {
    id: 9111,
    position: 1,
    text: '',
    answerTypeId: AnswerType.SingleSelect,
    isConditionTarget: false,
    isDecimal: null,
    isNotable: [],
    label: '',
    restrictionMax: null,
    restrictionMin: null,
    values: null,
    valuesCode: null,
    condition: null,
    ...overwrite,
  };
}

function createQuestion(overwrite: Partial<Question> = {}): Question {
  return {
    id: 9110,
    isMandatory: true,
    position: 1,
    text: 'How do you feel?',
    condition: null,
    answerOptions: [createAnswerOption()],
    ...overwrite,
  };
}

function create5AnswerOptions(baseId: number): AnswerOption[] {
  return [
    createAnswerOption({
      id: baseId + 1,
      position: 1,
      text: 'Head',
      answerTypeId: AnswerType.SingleSelect,
      values: ['Bad', 'Medium', 'Good', 'Not specified'],
      valuesCode: [0, 1, 2, 3],
    }),
    createAnswerOption({
      id: baseId + 2,
      position: 2,
      text: 'Belly',
      answerTypeId: AnswerType.MultiSelect,
      values: ['Bad', 'Medium', 'Good', 'Not specified'],
      valuesCode: [0, 1, 2, 3],
    }),
    createAnswerOption({
      id: baseId + 3,
      position: 3,
      text: 'Scan Sample ID',
      answerTypeId: AnswerType.Sample,
    }),
    createAnswerOption({
      id: baseId + 4,
      position: 4,
      text: 'Please upload image',
      answerTypeId: AnswerType.Image,
    }),
    createAnswerOption({
      id: baseId + 5,
      position: 5,
      text: 'Please upload another image',
      answerTypeId: AnswerType.Image,
    }),
  ];
}

export function createQuestionnaire(
  overwrite: Partial<Questionnaire> = {}
): Questionnaire {
  const id = overwrite.id ?? 9100;
  return {
    id: id,
    version: 1,
    studyId: 'QTestStudy',
    name: 'ApiTestQuestionnaire',
    noQuestions: 2,
    cycleAmount: 1,
    cycleUnit: 'week',
    activateAfterDays: 1,
    deactivateAfterDays: 365,
    notificationTries: 3,
    notificationTitle: 'PIA Fragebogen',
    notificationBodyNew: 'NeuNachricht',
    notificationBodyInProgress: 'AltNachricht',
    notificationWeekday: null,
    notificationInterval: null,
    notificationIntervalUnit: null,
    activateAtDate: null,
    complianceNeeded: true,
    expiresAfterDays: 5,
    finalisesAfterDays: 2,
    type: 'for_probands',
    publish: 'allaudiences',
    notifyWhenNotFilled: false,
    notifyWhenNotFilledTime: null,
    notifyWhenNotFilledDay: null,
    cyclePerDay: null,
    cycleFirstHour: null,
    keepAnswers: false,
    active: true,
    createdAt: new Date('2021-09-01'),
    updatedAt: new Date('2021-09-01T07:27:35.290Z'),
    condition: null,
    questions: [
      createQuestion({
        id: id + 10,
        position: 1,
        text: 'How do you feel?',
        answerOptions: create5AnswerOptions(id + 10),
      }),
      createQuestion({
        id: id + 20,
        position: 2,
        text: 'How do you feel now?',
        answerOptions: create5AnswerOptions(id + 20),
      }),
    ],
    ...overwrite,
  };
}

export function createQuestionnaireInstance(
  overwrite: Partial<QuestionnaireInstance> = {}
): QuestionnaireInstance {
  return {
    id: 19100,
    studyId: 'QTestStudy',
    questionnaireName: 'ApiTestQuestionnaire',
    pseudonym: 'qtest-proband1',
    dateOfIssue: new Date('2017-08-07T22:00:00.000Z'),
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'active',
    notificationsScheduled: false,
    progress: 0,
    releaseVersion: 0,
    questionnaire: createQuestionnaire(),
    ...overwrite,
  };
}
