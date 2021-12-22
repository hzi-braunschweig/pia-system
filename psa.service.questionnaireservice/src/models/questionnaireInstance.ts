/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  DbQuestionnaireForPM,
  QuestionnaireDto,
  Questionnaire,
} from './questionnaire';

export type QuestionnaireInstanceStatus =
  | 'inactive'
  | 'active'
  | 'in_progress'
  | 'released'
  | 'released_once'
  | 'released_twice'
  | 'expired'
  | 'deleted';

export interface DbQuestionnaireInstance {
  id: number;
  study_id: string;
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  user_id: string | null;
  date_of_issue: Date;
  date_of_release_v1: Date | null;
  date_of_release_v2: Date | null;
  cycle: number;
  status: QuestionnaireInstanceStatus;
  notifications_scheduled: boolean | null;
  progress: number | null;
  release_version: number | null;
}

export interface QuestionnaireInstance extends DbQuestionnaireInstance {
  questionnaire: Questionnaire;
}

export interface QuestionnaireInstanceForPM extends DbQuestionnaireInstance {
  questionnaire: DbQuestionnaireForPM | undefined;
}

export interface QuestionnaireInstanceDto {
  id: number;
  studyId: string | null;
  questionnaireName: string;
  pseudonym: string | null;
  dateOfIssue: Date;
  dateOfReleaseV1: Date | null;
  dateOfReleaseV2: Date | null;
  cycle: number;
  status: QuestionnaireInstanceStatus;
  notificationsScheduled: boolean | null;
  progress: number | null;
  releaseVersion: number | null;
  questionnaire?: QuestionnaireDto;
}
