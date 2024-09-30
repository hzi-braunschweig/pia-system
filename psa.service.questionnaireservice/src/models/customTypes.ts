/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * A resource ID
 * @isInt
 * @example "456"
 */
export type ResourceID = number;
/**
 * ISO 8601 date string with a fixed format.
 * A date value can be restricted to a range, defined by its answer option.
 *
 * @pattern ^\d{4}-\d{2}-\d{2}$
 * @example "2024-02-06"
 */
export type IsoDateString = string;
/**
 * ISO 8601 timestamp string.
 *
 * @example "2024-02-06T12:12:12.000Z"
 */
export type IsoTimestampString = string;
/**
 * Sample ID, consisting of an optional prefix and number sequence.
 * The prefix and length of the number sequence is defined by the
 * corresponding study.
 *
 * @pattern ^([A-Z]+-)?[0-9]+$
 * @example "PREFIX-012345678"
 */
export type SampleId = string;
/**
 * Value for answer of type "Text".
 *
 * @example "Any textual answer"
 */
export type TextValue = string;
/**
 * Pharmacy central number for pharmaceutical products in Germany.
 * Value for answer of type "PZN".
 *
 * @pattern ^-[0-9]{8}$
 * @example "-12345678"
 */
export type Pzn = string;
/**
 * Numeric codes from a set of choices.
 * Answer for type of "SingleSelect".
 *
 * @isInt
 * @example "2"
 */
export type SingleSelectValue = number;
/**
 * Array of numeric codes from a set of choices.
 * Answer for type of "MultipleSelect".
 *
 * @isInt
 * @example [2,5,9]
 */
export type MultipleSelectValue = number[];

/**
 * This function is a type guard for IsoDateString.
 *
 * It checks if the provided value is a string that matches the format (YYYY-MM-DD)
 * of ISO 8601. It does check if the given year, month and day are valid.
 *
 * It does not check for other valid formats of the ISO 8601 date standard.
 */
export function isIsoDateString(value: unknown): value is IsoDateString {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  try {
    const date = new Date(value);
    return date.toISOString().split('T')[0] === value;
  } catch (e: unknown) {
    return false;
  }
}
