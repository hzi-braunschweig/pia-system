/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';

/**
 * Checks if a given date value falls within a range of days relative to today.
 * Start and end parameters represent the number of days before and
 * after the current day.
 *
 * Example:
 * isDateInRange(dateValue, -4, 10) matches all dates 4 days before and 10 days after today
 * isDateInRange(dateValue, 1, 2) matches all dates from tomorrow to the day after tomorrow
 * isDateInRange(dateValue, -2, -1) matches all dates from the day before yesterday to yesterday
 *
 * @param value The numeric or Date value to check
 * @param startDaysFromToday Smallest acceptable Date from today in days
 * @param endDaysFromToday Largest acceptable Date from today in days
 */
export default function isDateInRange(
  value: Date,
  startDaysFromToday: number,
  endDaysFromToday: number
): boolean {
  let dateRangeStart = startOfDay(new Date());
  dateRangeStart =
    startDaysFromToday > 0
      ? addDays(dateRangeStart, startDaysFromToday)
      : subDays(dateRangeStart, Math.abs(startDaysFromToday));

  let dateRangeEnd = endOfDay(new Date());
  dateRangeEnd =
    endDaysFromToday > 0
      ? addDays(dateRangeEnd, endDaysFromToday)
      : subDays(dateRangeEnd, Math.abs(endDaysFromToday));

  return (
    value.getTime() > dateRangeStart.getTime() &&
    value.getTime() < dateRangeEnd.getTime()
  );
}
