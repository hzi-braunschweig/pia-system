/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionInternalDto } from './question';
import { ConditionInternalDto } from './condition';

export type QuestionnaireType = 'for_probands' | 'for_research_team';

export type CycleUnit = 'once' | 'day' | 'week' | 'month' | 'hour' | 'spontan';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface QuestionnaireInternalDto {
  id: number;
  version: number;
  studyId: string | null;
  name: string;
  noQuestions: number;
  cycleAmount: number | null;
  cycleUnit: CycleUnit | null;
  activateAfterDays: number;
  deactivateAfterDays: number;
  notificationTries: number;
  notificationTitle: string;
  notificationBodyNew: string;
  notificationBodyInProgress: string;
  notificationWeekday: Weekday | null;
  notificationInterval: number | null;
  notificationIntervalUnit: string | null;
  activateAtDate: Date | null;
  complianceNeeded: boolean | null;
  expiresAfterDays: number;
  finalisesAfterDays: number;
  type: QuestionnaireType | null;
  publish: string | null;
  notifyWhenNotFilled: boolean | null;
  notifyWhenNotFilledTime: string | null;
  notifyWhenNotFilledDay: number | null;
  cyclePerDay: number | null;
  cycleFirstHour: number | null;
  keepAnswers: boolean | null;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  questions: QuestionInternalDto[];
  condition: ConditionInternalDto | null;
}
