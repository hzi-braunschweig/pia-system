/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Type guard to check and narrow a value to type string[]
 * @param input
 */
export function isArrayOfStrings(input: unknown): input is string[] {
  return (
    Array.isArray(input) && input.every((entry) => typeof entry === 'string')
  );
}

/**
 * Type guard to check if a variable is an object with a specific (but unknown) property.
 * @param obj the object
 * @param key the name of the property that the object should own
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Type guard to check if a variable is an object with a specific property, that is not null or undefined.
 * @param obj the object
 * @param key the name of the property that the object should own
 */
export function hasNonNullishProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, Exclude<unknown, undefined | null>> {
  return hasProperty(obj, key) && obj[key] !== undefined && obj[key] !== null;
}
