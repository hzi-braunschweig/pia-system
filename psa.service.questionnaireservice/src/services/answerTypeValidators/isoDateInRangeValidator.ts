/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import isDateInRange from '../../helpers/isDateInRange';
import { AnswerValue } from '../../models/answer';
import { isIsoDateString } from '../../models/customTypes';

/**
 * @see isDateInRange()
 * @param value The numeric or Date value to check
 * @param startDaysFromToday Smallest acceptable Date from today in days
 * @param endDaysFromToday Largest acceptable Date from today in days
 */
export default function isoDateInRangeValidator(
  value: AnswerValue,
  startDaysFromToday: number | null,
  endDaysFromToday: number | null
): string | null {
  if (isIsoDateString(value)) {
    if (
      startDaysFromToday &&
      endDaysFromToday &&
      !isDateInRange(new Date(value), startDaysFromToday, endDaysFromToday)
    ) {
      return `expected: date between ${startDaysFromToday} and ${endDaysFromToday} days from today`;
    }
  } else {
    return 'expected: ISO 8601 date';
  }

  return null;
}
