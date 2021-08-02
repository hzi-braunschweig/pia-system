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
