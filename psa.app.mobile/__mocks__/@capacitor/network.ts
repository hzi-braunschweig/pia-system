/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ConnectionStatus {
  connected: boolean;
  connectionType: string;
}

export const Network = {
  getStatus: () => Promise.resolve({ connected: true, connectionType: 'wifi' }),
  addListener: (action, callbackFn) => Promise.resolve(),
};
