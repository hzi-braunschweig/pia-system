/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function getArrayIntersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((value) => array2.includes(value));
}
