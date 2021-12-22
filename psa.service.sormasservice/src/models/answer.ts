/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOption } from './answerOption';

export interface Answer {
  answerOption: AnswerOption;
  versioning: number;
  value: string;
  dateOfRelease: Date | null;
  releasingPerson: string | null;
}
