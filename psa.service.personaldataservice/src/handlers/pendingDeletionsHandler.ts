/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';

import { PendingDeletionsInteractor } from '../interactors/pendingDeletionsInteractor';
import { handleError } from '../handleError';
import { PendingDeletionReq } from '../models/pendingDeletion';

export class PendingDeletionsHandler {
  /**
   * Gets the all pending deletion of one study
   */
  public static getAllOfStudy: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletions(
      request.params['studyName'] as string
    ).catch((err: Error) =>
      handleError(request, 'Could not get pending deletion:', err)
    );
  };

  /**
   * Gets the pending deletion
   */
  public static getOne: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletion(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch((err: Error) =>
      handleError(request, 'Could not get pending deletion:', err)
    );
  };

  /**
   * Creates the pending deletion
   */
  public static createOne: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.createPendingDeletion(
      request.auth.credentials as AccessToken,
      request.payload as PendingDeletionReq
    ).catch((err: Error) =>
      handleError(request, 'Could not create pending deletion:', err)
    );
  };

  /**
   * Executes the pending deletion
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.executePendingDeletion(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch((err: Error) =>
      handleError(request, 'Could not update pending deletion:', err)
    );
  };

  /**
   * Deletes the pending deletion
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.deletePendingDeletion(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    )
      .then(() => null)
      .catch((err: Error) =>
        handleError(request, 'Could not delete pending deletion:', err)
      );
  };
}
