/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Questionnaire } from './questionnaire';

export type QuestionnaireStatus =
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
  study_id: string | null;
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  user_id: string;
  date_of_issue: Date;
  date_of_release_v1: Date | null;
  date_of_release_v2: Date | null;
  cycle: number;
  status: QuestionnaireStatus;
  notifications_scheduled: boolean | null;
  progress: number | null;
  release_version: number | null;
  transmission_ts_v1: Date | null;
  transmission_ts_v2: Date | null;
}

export interface QuestionnaireInstance extends DbQuestionnaireInstance {
  questionnaire: Questionnaire;
}
