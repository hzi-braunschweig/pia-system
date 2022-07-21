/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import { handleError } from './handleError';
import { PendingDeletionsInteractor } from '../interactors/pendingDeletionsInteractor';
import { AccessToken } from '@pia/lib-service-core';
import {
  PendingDeletionRequest,
  PendingDeletionType,
} from '../models/pendingDeletion';

/**
 * @description HAPI Handler for pending deletions
 */
export class PendingDeletionsHandler {
  public static getOne: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletion(
      request.auth.credentials as AccessToken,
      request.params['id'] as number
    );
  };

  public static getOneForProband: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletionForProbandId(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    );
  };

  public static getOneForSampleId: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletionForSampleId(
      request.auth.credentials as AccessToken,
      request.params['sampleId'] as string
    );
  };

  public static getOneForStudy: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletionForStudy(
      request.auth.credentials as AccessToken,
      request.params['studyName'] as string
    );
  };

  public static getAllOfStudy: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.getPendingDeletions(
      request.params['studyName'] as string,
      request.query['type'] as PendingDeletionType
    ).catch(handleError);
  };

  public static createOne: Lifecycle.Method = async (request) => {
    return PendingDeletionsInteractor.createPendingDeletion(
      request.auth.credentials as AccessToken,
      request.payload as PendingDeletionRequest
    ).catch(handleError);
  };

  public static updateOne: Lifecycle.Method = async (request) => {
    await PendingDeletionsInteractor.updatePendingDeletion(
      request.auth.credentials as AccessToken,
      request.params['id'] as number
    );
    return null;
  };

  public static deleteOne: Lifecycle.Method = async (request) => {
    await PendingDeletionsInteractor.cancelPendingDeletion(
      request.auth.credentials as AccessToken,
      request.params['id'] as number
    );
    return null;
  };
}
