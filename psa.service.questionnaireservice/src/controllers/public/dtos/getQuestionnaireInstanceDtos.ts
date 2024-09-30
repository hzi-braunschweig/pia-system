/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyName } from '@pia/lib-publicapi';
import { QuestionnaireInstance } from '../../../entities/questionnaireInstance';
import { CustomName } from '../../../models/questionnaire';

export type GetQuestionnaireInstanceResponseDto = Omit<
  QuestionnaireInstance,
  'questionnaire' | 'answers' | 'studyId' | 'origin'
> & {
  studyName: StudyName;
  /** @isInt */
  questionnaireId: number;
  /** @isInt */
  questionnaireVersion: number;
  questionnaireCustomName: CustomName | null;
};
