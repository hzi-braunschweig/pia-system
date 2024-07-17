/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CycleUnit, QuestionnaireType, Questionnaire } from './questionnaire';

export interface QuestionnaireInstance extends BaseQuestionnaireInstance {
  study_id: string;
  cycle: number;
  date_of_release_v2: Date | null;
  release_version: number;
}

export interface BaseQuestionnaireInstance {
  id: number;
  date_of_issue: Date;
  status: QuestionnaireInstanceStatus;
  date_of_release_v1: Date | null;
  user_id: string;
  study_id: string;
  sort_order: number | null;
  cycle_unit: CycleUnit;
  expires_after_days: number;
  finalises_after_days: number;
  type: QuestionnaireType;
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  questionnaire_custom_name: string;
  ids: string;
}

export interface QuestionnaireInstanceNew {
  study_id: string;
  status: QuestionnaireInstanceStatus;
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  sort_order: number | null;
  user_id: string;
  date_of_issue: Date;
  cycle: number;
}

export interface QuestionnaireInstanceQuestionnairePair<QI> {
  questionnaireInstance: QI;
  questionnaire: Pick<Questionnaire, 'id' | 'custom_name'>;
}

export type QuestionnaireInstanceStatus =
  | 'inactive'
  | 'expired'
  | 'active'
  | 'in_progress'
  | 'released_once'
  | 'released_twice'
  | 'released'
  | 'deleted';
