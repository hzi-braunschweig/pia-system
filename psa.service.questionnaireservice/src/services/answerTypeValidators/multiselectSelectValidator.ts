/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../models/answer';
import { MultipleSelectValue } from '../../models/customTypes';

export default function multiSelectValidator(
  value: AnswerValue,
  valuesCode: number[] | null
): string | null {
  if (isMultipleChoice(value)) {
    const choices = valuesCode ?? [];

    if (!value.every((v) => choices.includes(v))) {
      return `expected: to match one or more of ${choices.join(', ')}`;
    }
  } else {
    return 'expected: number[]';
  }

  return null;
}

function isMultipleChoice(value: AnswerValue): value is MultipleSelectValue {
  return (
    Array.isArray(value) &&
    (value as (string | number)[]).every((v) => typeof v === 'number')
  );
}
