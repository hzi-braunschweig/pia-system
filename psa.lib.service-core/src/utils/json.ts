/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isValid, parseISO } from 'date-fns';

/**
 * Reviver function which can be passed as second argument to
 * JSON.parse() in order to convert all ISO date strings to Date instances
 *
 * Attention! This may convert strings to Date instances which were not intended to be a date!
 * Always use this with caution and only in cases were you know what you are parsing.
 *
 * @example
 * const parsed = JSON.parse(response, isoDateStringReviverFn);
 */
export function isoDateStringReviverFn(
  this: void,
  _key: string,
  value: unknown
): unknown {
  if (typeof value === 'string' && isIsoDateString(value)) {
    return new Date(value);
  }
  return value;
}

function isIsoDateString(value: string): boolean {
  const possibleDate = parseISO(value);
  return isValid(possibleDate);
}
