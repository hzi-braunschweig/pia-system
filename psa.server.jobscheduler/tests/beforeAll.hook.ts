/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const mochaHooks = {
  beforeAll(): void {
    // Disable console.log for all tests
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.log = (): void => {};
  },
};
