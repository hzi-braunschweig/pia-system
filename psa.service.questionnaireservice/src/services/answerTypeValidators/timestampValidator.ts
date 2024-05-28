/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../models/answer';

import { isIsoDateString } from '../../models/customTypes';

export default function timestampValidator(value: AnswerValue): string | null {
  if (
    typeof value !== 'string' ||
    (!isIsoDateString(value) && isNaN(new Date(value).valueOf()))
  ) {
    return 'expected: ISO 8601 timestamp';
  }

  return null;
}
