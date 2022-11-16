/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { QuestionnaireInstance } from '../../src/models/questionnaireInstance';
import { AnswerOption, AnswerType } from '../../src/models/answerOption';
import { Answer } from '../../src/models/answer';
import { JournalPersonDto } from '../../src/models/sormas';
import {
  AccountStatus,
  ProbandInternalDto,
  ProbandResponseInternalDto,
  ProbandStatus,
} from '@pia-system/lib-http-clients-internal';

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
    ...overwrite,
  };
}

export function createAnswerOption(
  overwrite: Partial<AnswerOption> = {}
): AnswerOption {
  return {
    answerTypeId: AnswerType.Text,
    id: 0,
    label: null,
    isConditionTarget: false,
    isDecimal: false,
    isNotable: null,
    position: 0,
    restrictionMax: null,
    restrictionMin: null,
    text: null,
    values: null,
    valuesCode: null,
    ...overwrite,
  };
}

export function createAnswer(overwrite: Partial<Answer> = {}): Answer {
  return {
    answerOption: createAnswerOption(),
    dateOfRelease: null,
    releasingPerson: null,
    value: '',
    versioning: 1,
    ...overwrite,
  };
}

export function createJournalPersonDto(
  overwrites: Partial<JournalPersonDto>
): JournalPersonDto {
  return {
    uuid: 'some-uuid',
    pseudonymized: true,
    firstName: 'Test',
    lastName: 'User',
    emailAddress: 'test-user@example.com',
    phone: '0123456789',
    birthdateDD: 12,
    birthdateMM: 11,
    birthdateYYYY: 1978,
    sex: 'Female',
    latestFollowUpEndDate: new Date(),
    followUpStatus: 'Under follow-up',
    ...overwrites,
  };
}

export function createProbandResponse(
  overwrites: Partial<ProbandResponseInternalDto>
): ProbandResponseInternalDto {
  return {
    complianceBloodsamples: false,
    complianceLabresults: false,
    complianceSamples: false,
    examinationWave: 0,
    ids: 'some-uuid',
    password: 'secret',
    pseudonym: 'test-0123456789',
    study: 'Teststudy',
    studyCenter: null,
    ...overwrites,
  };
}

export function createProband(
  overwrites: Partial<ProbandInternalDto>
): ProbandInternalDto {
  return {
    pseudonym: 'TEST-0123456789',
    role: 'Proband',
    study: 'Teststudy',
    first_logged_in_at: null,
    complianceLabresults: false,
    complianceBloodsamples: false,
    complianceSamples: false,
    complianceContact: true,
    accountStatus: AccountStatus.ACCOUNT,
    status: ProbandStatus.ACTIVE,
    ids: 'some-uuid',
    study_accesses: [{ study_id: 'Teststudy', access_level: 'read' }],
    ...overwrites,
  };
}
