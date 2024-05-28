/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstance } from '../../../entities/questionnaireInstance';
import { StudyName } from '../../../models/customTypes';
import { CustomName } from '../../../models/questionnaire';

export type GetQuestionnaireInstanceResponseDto = Omit<
  QuestionnaireInstance,
  'questionnaire' | 'answers' | 'studyId'
> & {
  studyName: StudyName;
  /** @isInt */
  questionnaireId: number;
  /** @isInt */
  questionnaireVersion: number;
  questionnaireCustomName: CustomName | null;
};
