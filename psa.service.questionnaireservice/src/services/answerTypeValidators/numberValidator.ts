/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import isNumberInRange from '../../helpers/isNumberInRange';
import { AnswerValue } from '../../models/answer';

export default function numberValidator(
  value: AnswerValue,
  min: number | null,
  max: number | null
): string | null {
  if (typeof value === 'number') {
    if (min && max && !isNumberInRange(value, min, max)) {
      return `expected: number between ${min} and ${max}`;
    }
  } else {
    return 'expected: number';
  }

  return null;
}
