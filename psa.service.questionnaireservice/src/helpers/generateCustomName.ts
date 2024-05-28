/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export default function generateCustomName(
  name: string,
  suffix: number
): string {
  // Max characters of first part
  const maxChars = 10;

  // Non-alphanumeric characters except for whitespace
  const replaced = name.replace(/[^A-Za-z0-9\s]+/g, '');

  const words = replaced.split(' ');

  // CamelCase transformation and truncate
  name = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .slice(0, maxChars);

  return `${name}-${suffix}`;
}
