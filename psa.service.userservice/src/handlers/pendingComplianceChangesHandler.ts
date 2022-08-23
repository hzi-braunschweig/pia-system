/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PendingComplianceChangesInteractor } from '../interactors/pendingComplianceChangesInteractor';
import { handleError } from './handleError';
import { Lifecycle } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';
import { PendingComplianceChangeRequest } from '../models/pendingComplianceChange';

/**
 * @description HAPI Handler for pending compliance changes
 */
export class PendingComplianceChangesHandler {
  public static getOne: Lifecycle.Method = async (request) => {
    return PendingComplianceChangesInteractor.getPendingComplianceChange(
      request.auth.credentials as AccessToken,
      request.params['id'] as string
    ).catch(handleError);
  };

  public static getAllOfStudy: Lifecycle.Method = async (request) => {
    return PendingComplianceChangesInteractor.getPendingComplianceChanges(
      request.params['studyName'] as string
    ).catch(handleError);
  };

  public static createOne: Lifecycle.Method = async (request) => {
    return PendingComplianceChangesInteractor.createPendingComplianceChange(
      request.auth.credentials as AccessToken,
      request.payload as PendingComplianceChangeRequest
    ).catch(handleError);
  };

  public static updateOne: Lifecycle.Method = async (request) => {
    return PendingComplianceChangesInteractor.updatePendingComplianceChange(
      request.auth.credentials as AccessToken,
      request.params['id'] as string
    ).catch(handleError);
  };

  public static deleteOne: Lifecycle.Method = async (request) => {
    return PendingComplianceChangesInteractor.deletePendingComplianceChange(
      request.auth.credentials as AccessToken,
      request.params['id'] as string
    ).catch(handleError);
  };
}
