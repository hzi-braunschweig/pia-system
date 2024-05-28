/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AnswerOption,
  AnswerOptionDto,
  AnswerOptionRequest,
  AnswerOptionResponse,
} from './answerOption';
import {
  Condition,
  ConditionDto,
  ConditionRequest,
  ConditionResponse,
} from './condition';
import { QuestionnaireDto } from './questionnaire';

export interface DbQuestion {
  id: number;
  questionnaire_id: number;
  questionnaire_version: number;
  text: string;
  help_text: string;
  position: number;
  is_mandatory: boolean | null;
  variable_name: string | null;
}

/**
 * @deprecated
 */
export interface Question extends DbQuestion {
  answer_options: AnswerOption[];
  condition: Condition | null;
  variable_name: string | null;
}

export interface QuestionDto {
  /**
   * @isInt
   */
  id: number;
  isMandatory: boolean | null;
  position: number;
  text: string;
  helpText: string | null;
  variableName: string | null;
  questionnaire?: QuestionnaireDto;
  answerOptions?: AnswerOptionDto[];
  condition?: ConditionDto | null;
}

export interface QuestionResponse extends DbQuestion {
  condition: ConditionResponse | null;
  answer_options: AnswerOptionResponse[];
}

export interface QuestionRequest {
  id?: number;
  text: string;
  help_text: string;
  variable_name: string;
  position: number;
  is_mandatory: boolean;
  answer_options?: AnswerOptionRequest[];
  condition?: ConditionRequest;
}
