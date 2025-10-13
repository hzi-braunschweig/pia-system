/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const App = {
  addListener: () => ({
    remove: () => Promise.resolve(),
  }),
  exitApp: () => Promise.resolve(),
  getState: () => Promise.resolve({ isActive: true }),
  minimizeApp: () => Promise.resolve(),
  getInfo: () => Promise.resolve({ version: '1.0.0' }),
};
