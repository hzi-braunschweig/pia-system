/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstance } from './questionnaireInstance';
import { Question } from './question';
import { AnswerOption } from './answerOption';

export interface Answer {
  questionnaireInstance?: QuestionnaireInstance;
  question?: Question;
  answerOption?: AnswerOption;
  versioning: number;
  value: string;
  dateOfRelease: Date | null;
  releasingPerson: string | null;
}

export interface DbAnswer {
  question_id: number;
  questionnaire_instance_id: number;
  answer_option_id: number;
  versioning?: number;
  value: string;
  date_of_release?: Date;
  releasing_person?: string;
}
