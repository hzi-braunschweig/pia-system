/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstance } from './questionnaireInstance';
import { Condition } from './condition';

export interface Answer {
  question_id: number;
  questionnaire_instance_id: number;
  answer_option_id: number;
  versioning?: number;
  value: string;
  date_of_release?: Date;
  releasing_person?: string;
}

export type AnswerWithQuestionnaireInstance = Answer & QuestionnaireInstance;
export type AnswerWithCondition = Answer &
  Omit<Condition, 'id'> & {
    condition_id: number;
  };
