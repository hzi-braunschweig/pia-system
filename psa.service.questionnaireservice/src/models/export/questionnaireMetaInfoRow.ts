/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DbCondition } from '../condition';

export interface QuestionnaireMetaInfoRow {
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  questionnaire_condition: [DbCondition | null];
  question_id: number;
  question_variable_name: string;
  question_position: number;
  question_is_mandatory: boolean;
  question_condition: [DbCondition | null];
  answeroption_id: number;
  answeroption_text: string;
  answeroption_type_id: number;
  answeroption_position: number;
  answeroption_values: string[];
  answeroption_value_code: string[];
  answeroption_variable_name: string;
  answeroption_condition: [DbCondition | null];
}
