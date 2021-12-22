/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOptionInternalDto } from './answerOption';

export interface AnswerInternalDto {
  answerOption: AnswerOptionInternalDto;
  versioning: number;
  value: string;
  dateOfRelease: Date | null;
  releasingPerson: string | null;
}
