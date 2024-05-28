/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../models/answer';

export default function singleSelectValidator(
  value: AnswerValue,
  valuesCode: number[] | null
): string | null {
  if (typeof value === 'number') {
    const choices = valuesCode ?? [];
    if (!choices.includes(value)) {
      return `expected: to match one of ${choices.join(', ')}`;
    }
  } else {
    return 'expected: number';
  }

  return null;
}
