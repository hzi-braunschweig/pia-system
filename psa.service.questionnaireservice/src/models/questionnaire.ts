/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Condition,
  ConditionDto,
  ConditionRequest,
  ConditionResponse,
} from './condition';
import {
  Question,
  QuestionDto,
  QuestionRequest,
  QuestionResponse,
} from './question';

export type QuestionnaireType = 'for_probands' | 'for_research_team';

export type CycleUnit = 'once' | 'day' | 'week' | 'month' | 'hour' | 'spontan';

/**
 * A questionnaires custom name helps to reference a questionnaire by a speakable and unique name.
 *
 * @example "asthma_medical_trail"
 * @pattern ^[a-zA-Z0-9-_]+$
 */
export type CustomName = string;

export interface DbQuestionnaireForPM {
  id: number;
  cycle_unit: CycleUnit | null;
}

export interface DbQuestionnaire extends DbQuestionnaireForPM {
  id: number;
  version: number;
  study_id: string;
  custom_name: CustomName | null;
  sort_order: number | null;
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
  notification_link_to_overview: boolean;
  activate_at_date: Date | null;
  compliance_needed: boolean | null;
  expires_after_days: number;
  finalises_after_days: number;
  created_at: Date | null;
  readonly updated_at: Date | null;
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

/**
 * @deprecated
 */
export interface Questionnaire extends DbQuestionnaire {
  questions: Question[];
  condition: Condition | null;
}

export interface QuestionnaireDto {
  /** @isInt */
  id: number;
  /** @isInt */
  version: number;
  studyId: string;
  customName: CustomName | null;
  /** @isInt */
  sortOrder: number | null;
  name: string;
  /** @isInt */
  noQuestions: number;
  /** @isInt */
  cycleAmount: number | null;
  cycleUnit: CycleUnit | null;
  /** @isInt */
  activateAfterDays: number;
  /** @isInt */
  deactivateAfterDays: number;
  /** @isInt */
  notificationTries: number;
  notificationTitle: string;
  notificationBodyNew: string;
  notificationBodyInProgress: string;
  notificationWeekday: string | null;
  /**
   * If set to `true`, notifications for participants will link to the overview
   * of their instances instead of the instance itself.
   */
  notificationLinkToOverview: boolean;
  /** @isInt */
  notificationInterval: number | null;
  notificationIntervalUnit: string | null;
  activateAtDate: Date | null;
  complianceNeeded: boolean | null;
  /** @isInt */
  expiresAfterDays: number;
  /** @isInt */
  finalisesAfterDays: number;
  type: QuestionnaireType | null;
  publish: string | null;
  notifyWhenNotFilled: boolean | null;
  notifyWhenNotFilledTime: string | null;
  /** @isInt */
  notifyWhenNotFilledDay: number | null;
  /** @isInt */
  cyclePerDay: number | null;
  /** @isInt */
  cycleFirstHour: number | null;
  keepAnswers: boolean | null;
  active: boolean;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
  questions?: QuestionDto[];
  condition?: ConditionDto | null;
}

export interface QuestionnaireResponse extends DbQuestionnaire {
  condition: ConditionResponse | null;
  questions: QuestionResponse[];
  links: {
    self: {
      href: string;
    };
  };
}

export interface QuestionnaireRequest {
  study_id: string;
  cycle_amount: number;
  sort_order: number | null;
  activate_at_date?: Date;
  cycle_unit: CycleUnit;
  cycle_per_day?: number | null;
  cycle_first_hour?: number | null;
  publish: string;
  /*  keep_answers: In some cases, questionnaire answers are to be kept, even
      in case of the answering proband is removed automatically, like it
      may happen in a SORMAS context. Kept answers might deal with usage
      satisfaction, for example. */
  keep_answers?: boolean;
  activate_after_days: number;
  deactivate_after_days: number;
  name: string;
  custom_name: string | null;
  type: QuestionnaireType;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_link_to_overview?: boolean;
  questions?: QuestionRequest[];
  condition?: ConditionRequest;
  notification_weekday?: string | null;
  notification_interval?: number | null;
  notification_interval_unit?: string | null;
  compliance_needed?: boolean;
  notify_when_not_filled?: boolean;
  notify_when_not_filled_time?: string | null;
  notify_when_not_filled_day?: number | null;
  expires_after_days?: number;
  finalises_after_days?: number;
  active?: boolean;
}
