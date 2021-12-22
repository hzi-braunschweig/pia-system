/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOption } from './answerOption';
import { Condition } from './condition';
import { Questionnaire } from './questionnaire';

export interface Question {
  id: number;
  isMandatory: boolean | null;
  position: number;
  text: string;
  questionnaire?: Questionnaire;
  answerOptions?: AnswerOption[];
  condition?: Condition | null;
}
