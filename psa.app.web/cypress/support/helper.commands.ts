/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function expectLocation(pathname: string) {
  return cy
    .location()
    .should((location) => expect(location.pathname).to.eq(pathname));
}

export function getRandomId(): number {
  return Math.floor(Math.random() * 10000000000);
}

export function createRandomMailAddress(prefix: string): string {
  return `${prefix}-${getRandomId()}@example.com`;
}
