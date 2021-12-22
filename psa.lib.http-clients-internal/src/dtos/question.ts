/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConditionInternalDto } from './condition';
import { QuestionnaireInternalDto } from './questionnaire';
import { AnswerOptionInternalDto } from './answerOption';

export interface QuestionInternalDto {
  id: number;
  isMandatory: boolean | null;
  position: number;
  text: string;
  questionnaire?: QuestionnaireInternalDto;
  answerOptions?: AnswerOptionInternalDto[];
  condition?: ConditionInternalDto | null;
}
