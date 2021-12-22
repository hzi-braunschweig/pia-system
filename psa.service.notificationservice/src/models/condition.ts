/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOption } from './answerOption';
import { Questionnaire } from './questionnaire';
import { Question } from './question';

export enum ConditionType {
  INTERNAL_THIS = 'internal_this',
  INTERNAL_LAST = 'internal_last',
  EXTERNAL = 'external',
}
export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';

export interface Condition {
  id: number;
  type: ConditionType | null;
  value: string | null;
  link: ConditionLink | null;
  operand: ConditionOperand | null;
  targetAnswerOption?: AnswerOption | null;
  targetQuestionnaire?: Questionnaire | null;
  conditionAnswerOption?: AnswerOption | null;
  conditionQuestion?: Question | null;
  conditionQuestionnaire?: Questionnaire | null;
}
