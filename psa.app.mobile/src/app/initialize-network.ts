/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NetworkService } from './shared/services/network/network.service';

/**
 * This will initialize the network service listener that is used in http interceptors.
 */
export function initializeNetwork(
  networkService: NetworkService
): () => Promise<void> {
  return async () => {
    await networkService.initialize();
  };
}
