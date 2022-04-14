/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import pendingDeletionsInteractor from '../interactors/pendingDeletionsInteractor';
import handleError from '../handleError';
import { Lifecycle } from '@hapi/hapi';
import { PendingDeletionReq } from '../models/pendingDeletion';

export class PendingDeletionsHandler {
  /**
   * gets the all pending deletion of one study
   */
  public static getAllOfStudy: Lifecycle.Method = async (request) => {
    return pendingDeletionsInteractor
      .getPendingDeletions(
        request.auth.credentials,
        request.params['studyName'] as string
      )
      .catch((err) =>
        handleError(request, 'Could not get pending deletion:', err)
      );
  };

  /**
   * gets the pending deletion
   */
  public static getOne: Lifecycle.Method = async (request) => {
    return pendingDeletionsInteractor
      .getPendingDeletion(
        request.auth.credentials,
        request.params['proband_id'] as string
      )
      .catch((err) =>
        handleError(request, 'Could not get pending deletion:', err)
      );
  };

  /**
   * creates the pending deletion
   */
  public static createOne: Lifecycle.Method = async (request) => {
    return pendingDeletionsInteractor
      .createPendingDeletion(
        request.auth.credentials,
        request.payload as PendingDeletionReq
      )
      .catch((err) =>
        handleError(request, 'Could not create pending deletion:', err)
      );
  };

  /**
   * executes the pending deletion
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    return pendingDeletionsInteractor
      .executePendingDeletion(
        request.auth.credentials,
        request.params['proband_id'] as string
      )
      .catch((err) =>
        handleError(request, 'Could not update pending deletion:', err)
      );
  };

  /**
   * deletes the pending deletion
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    return pendingDeletionsInteractor
      .deletePendingDeletion(
        request.auth.credentials,
        request.params['pseudonym'] as string
      )
      .then(() => null)
      .catch((err) =>
        handleError(request, 'Could not delete pending deletion:', err)
      );
  };
}
