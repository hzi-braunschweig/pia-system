/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { GetQuestionnaireInstanceResponseDto } from '../../../../src/controllers/public/dtos/getQuestionnaireInstanceDtos';

export type PlainGetQuestionnaireInstanceResponseDto = Omit<
  GetQuestionnaireInstanceResponseDto,
  'dateOfIssue' | 'dateOfReleaseV1' | 'dateOfReleaseV2'
> & {
  dateOfIssue: string;
  dateOfReleaseV1: string;
  dateOfReleaseV2: string;
};

export const questionnaireInstance_100100: PlainGetQuestionnaireInstanceResponseDto =
  {
    id: 100100,
    studyName: 'Study A',
    pseudonym: 'stya01-0000000001',
    questionnaireId: 100,
    questionnaireVersion: 1,
    questionnaireName: 'Questionnaire A',
    questionnaireCustomName: 'questionnaire_a',
    sortOrder: null,
    dateOfIssue: '2024-01-19T06:00:00.000Z',
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'active',
    releaseVersion: 0,
    progress: 0,
    notificationsScheduled: false,
  };

export const questionnaireInstance_100101: PlainGetQuestionnaireInstanceResponseDto =
  {
    id: 100101,
    studyName: 'Study A',
    pseudonym: 'styb01-0000000001',
    questionnaireId: 100,
    questionnaireVersion: 1,
    questionnaireName: 'Questionnaire A',
    questionnaireCustomName: 'questionnaire_a',
    sortOrder: null,
    dateOfIssue: '2024-01-19T06:00:00.000Z',
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'in_progress',
    releaseVersion: 0,
    progress: 60,
    notificationsScheduled: false,
  };

export const questionnaireInstance_110100: PlainGetQuestionnaireInstanceResponseDto =
  {
    id: 110100,
    studyName: 'Study A',
    pseudonym: 'styb01-0000000001',
    questionnaireId: 110,
    questionnaireVersion: 1,
    questionnaireName: 'Questionnaire B',
    questionnaireCustomName: 'questionnaire_b',
    sortOrder: 10,
    dateOfIssue: '2024-02-20T16:00:00.000Z',
    dateOfReleaseV1: '2024-02-22T10:00:00.000Z',
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'released_once',
    releaseVersion: 1,
    progress: 100,
    notificationsScheduled: false,
  };

export const questionnaireInstance_110101: PlainGetQuestionnaireInstanceResponseDto =
  {
    id: 110101,
    studyName: 'Study A',
    pseudonym: 'stya01-0000000001',
    questionnaireId: 110,
    questionnaireVersion: 1,
    questionnaireName: 'Questionnaire B',
    questionnaireCustomName: 'questionnaire_b',
    sortOrder: 10,
    dateOfIssue: '2024-01-19T06:00:00.000Z',
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'in_progress',
    releaseVersion: 0,
    progress: 60,
    notificationsScheduled: false,
  };

export const questionnaireInstance_120101: PlainGetQuestionnaireInstanceResponseDto =
  {
    id: 120101,
    studyName: 'Study A',
    pseudonym: 'stya01-0000000001',
    questionnaireId: 120,
    questionnaireVersion: 1,
    questionnaireName: 'Questionnaire C',
    questionnaireCustomName: 'questionnaire_c',
    sortOrder: 20,
    dateOfIssue: '2024-01-19T06:00:00.000Z',
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'active',
    releaseVersion: 0,
    progress: 0,
    notificationsScheduled: false,
  };

export const questionnaireInstance_130101: PlainGetQuestionnaireInstanceResponseDto =
  {
    id: 130101,
    studyName: 'Study A',
    pseudonym: 'stya01-0000000001',
    questionnaireId: 130,
    questionnaireVersion: 1,
    questionnaireName: 'Questionnaire D',
    questionnaireCustomName: 'questionnaire_d',
    sortOrder: 30,
    dateOfIssue: '2024-01-19T06:00:00.000Z',
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'active',
    releaseVersion: 0,
    progress: 0,
    notificationsScheduled: false,
  };
