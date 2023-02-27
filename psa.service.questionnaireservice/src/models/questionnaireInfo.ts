/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Questionnaire } from '../entities/questionnaire';

export type QuestionnaireInfo = Pick<Questionnaire, 'id' | 'name' | 'version'>;

export type ConditionalQuestionnaireInfo = QuestionnaireInfo & {
  has_condition: boolean;
};
