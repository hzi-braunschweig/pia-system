/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PendingStudyChangesInteractor } from '../interactors/pendingStudyChangesInteractor';
import { Lifecycle } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';
import { PendingStudyChangeRequest } from '../models/pendingStudyChange';

export class PendingStudyChangesHandler {
  /**
   * creates the pending compliance change
   * @param request
   */
  public static createOne: Lifecycle.Method = async (request) => {
    return PendingStudyChangesInteractor.createPendingStudyChange(
      request.auth.credentials as AccessToken,
      request.payload as PendingStudyChangeRequest
    );
  };

  /**
   * executes the pending compliance change
   * @param request
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    const id = request.params['id'] as number;

    return PendingStudyChangesInteractor.updatePendingStudyChange(
      request.auth.credentials as AccessToken,
      id
    );
  };

  /**
   * deletes the pending compliance change
   * @param request
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    const id = request.params['id'] as number;

    return PendingStudyChangesInteractor.deletePendingStudyChange(
      request.auth.credentials as AccessToken,
      id
    );
  };
}
