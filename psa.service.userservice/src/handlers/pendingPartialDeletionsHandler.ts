/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import { PendingPartialDeletionsInteractor } from '../interactors/pendingPartialDeletionsInteractor';
import { AccessToken } from '@pia/lib-service-core';
import { PendingPartialDeletionReq } from '../models/pendingPartialDeletion';

/**
 * @description HAPI Handler for pending partial deletions
 */
export class PendingPartialDeletionsHandler {
  public static getOne: Lifecycle.Method = async (request) => {
    return PendingPartialDeletionsInteractor.getPendingPartialDeletion(
      request.auth.credentials as AccessToken,
      request.params['id'] as number
    );
  };

  public static createOne: Lifecycle.Method = async (request) => {
    return PendingPartialDeletionsInteractor.createPendingPartialDeletion(
      request.auth.credentials as AccessToken,
      request.payload as PendingPartialDeletionReq
    );
  };

  public static updateOne: Lifecycle.Method = async (request) => {
    return PendingPartialDeletionsInteractor.updatePendingPartialDeletion(
      request.auth.credentials as AccessToken,
      request.params['id'] as number
    );
  };

  public static deleteOne: Lifecycle.Method = async (request) => {
    return PendingPartialDeletionsInteractor.deletePendingPartialDeletion(
      request.auth.credentials as AccessToken,
      request.params['id'] as number
    );
  };
}
