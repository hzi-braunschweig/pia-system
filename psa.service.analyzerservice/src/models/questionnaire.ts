/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConditionType } from './condition';

export type QuestionnaireType = 'for_probands' | 'for_research_team';

export type CycleUnit =
  | 'once'
  | 'day'
  | 'week'
  | 'month'
  | 'hour'
  | 'spontan'
  | 'date';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Questionnaire {
  id: number;
  study_id: string;
  name: string;
  custom_name: string | null;
  no_questions: number;
  cycle_amount: number;
  cycle_unit: CycleUnit;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_weekday: Weekday | null;
  notification_interval: number;
  notification_interval_unit: 'days' | 'hours';
  activate_at_date: string;
  compliance_needed: boolean;
  expires_after_days: number;
  finalises_after_days: number;
  cycle_per_day: number | null;
  cycle_first_hour: number | null;
  created_at: Date;
  readonly updated_at: Date;
  type: QuestionnaireType;
  version: number;
  publish: string;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string;
  notify_when_not_filled_day: number;
  /*  keep_answers: In some cases, questionnaire answers are to be kept, even
    in case of the answering proband is removed automatically, like it
    may happen in a SORMAS context. Kept answers might deal with usage
    satisfaction, for example. */
  keep_answers: boolean;
  active: boolean;
}

export interface QuestionnaireWithConditionType extends Questionnaire {
  condition_type: ConditionType;
}
