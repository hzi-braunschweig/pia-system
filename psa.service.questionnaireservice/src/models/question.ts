/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AnswerOption,
  AnswerOptionRequest,
  AnswerOptionResponse,
} from './answerOption';
import { Condition, ConditionRequest, ConditionResponse } from './condition';

export interface DbQuestion {
  id: number;
  questionnaire_id: number;
  questionnaire_version: number;
  text: string;
  position: number;
  is_mandatory: boolean | null;
}

export interface Question extends DbQuestion {
  answer_options: AnswerOption[];
  condition: Condition | null;
}

export interface QuestionResponse extends DbQuestion {
  condition: ConditionResponse | null;
  answer_options: AnswerOptionResponse[];
}

export interface QuestionRequest {
  id?: number;
  text: string;
  label: string;
  position: number;
  is_mandatory: boolean;
  answer_options?: AnswerOptionRequest[];
  condition?: ConditionRequest;
}
