/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOption } from './answerOption';
import { Condition } from './condition';

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
