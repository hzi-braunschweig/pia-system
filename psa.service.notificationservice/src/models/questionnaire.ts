/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Question } from './question';
import { Condition } from './condition';

export type QuestionnaireType = 'for_probands' | 'for_research_team';

export type CycleUnit = 'once' | 'day' | 'week' | 'month' | 'hour' | 'spontan';

export interface DbQuestionnaireForPM {
  id: number;
  cycle_unit: CycleUnit | null;
}

export interface DbQuestionnaire extends DbQuestionnaireForPM {
  id: number;
  version: number;
  study_id: string;
  name: string;
  no_questions: number;
  cycle_amount: number | null;
  cycle_unit: CycleUnit | null;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_weekday: string | null;
  notification_interval: number | null;
  notification_interval_unit: string | null;
  activate_at_date: Date | null;
  compliance_needed: boolean | null;
  expires_after_days: number;
  finalises_after_days: number;
  created_at: Date | null;
  type: QuestionnaireType | null;
  publish: string | null;
  notify_when_not_filled: boolean | null;
  notify_when_not_filled_time: string | null;
  notify_when_not_filled_day: number | null;
  cycle_per_day: number | null;
  cycle_first_hour: number | null;
  keep_answers: boolean | null;
  active: boolean;
}

export interface Questionnaire extends DbQuestionnaire {
  questions: Question[];
  condition: Condition | null;
}
