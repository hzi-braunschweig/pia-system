/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstanceDto } from '../../../models/questionnaireInstance';

export type PatchQuestionnaireInstanceRequestDto = Pick<
  QuestionnaireInstanceDto,
  'status'
>;

export type PatchQuestionnaireInstanceResponseDto = Pick<
  QuestionnaireInstanceDto,
  'status' | 'releaseVersion' | 'progress'
>;
