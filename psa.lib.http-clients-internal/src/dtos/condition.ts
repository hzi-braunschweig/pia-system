/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionInternalDto } from './question';
import { QuestionnaireInternalDto } from './questionnaire';
import { AnswerOptionInternalDto } from './answerOption';

export enum ConditionType {
  INTERNAL_THIS = 'internal_this',
  INTERNAL_LAST = 'internal_last',
  EXTERNAL = 'external',
}
export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';

export interface ConditionInternalDto {
  id: number;
  type: ConditionType | null;
  value: string | null;
  link: ConditionLink | null;
  operand: ConditionOperand | null;
  targetAnswerOption?: AnswerOptionInternalDto | null;
  targetQuestionnaire?: QuestionnaireInternalDto | null;
  conditionAnswerOption?: AnswerOptionInternalDto | null;
  conditionQuestion?: QuestionInternalDto | null;
  conditionQuestionnaire?: QuestionnaireInternalDto | null;
}
