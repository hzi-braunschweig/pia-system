/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOption } from './answerOption';
import { Condition } from './questionnaire';

export interface Question {
  id: number;
  questionnaire_id: number;
  text: string;
  variable_name: string;
  position: number;
  is_mandatory: boolean;
  jump_step: number;
  answer_options: AnswerOption[];
  condition: Condition;
  condition_error: string;
}
