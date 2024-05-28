/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { ProbandsInteractor } from '../interactors/probandsInteractor';
import {
  CreateIDSProbandRequest,
  CreateProbandRequest,
} from '../models/proband';
import { ProbandSelfDeletionType } from '../services/probandService';
import { AccessToken } from '@pia/lib-service-core';

export class ProbandsHandler {
  public static getAll: Lifecycle.Method = async (request) => {
    return await ProbandsInteractor.getAllProbandsOfStudy(
      request.params['studyName'] as string
    );
  };

  /**
   * Creates the proband if it does not exist
   */
  public static createProband: Lifecycle.Method = async (request) => {
    return await ProbandsInteractor.createProband(
      request.params['studyName'] as string,
      request.payload as CreateProbandRequest
    );
  };

  /**
   * Creates the ids proband if it does not exist
   */
  public static createIDSProband: Lifecycle.Method = async (request) => {
    const { ids } = request.payload as CreateIDSProbandRequest;

    await ProbandsInteractor.createIDSProband(
      request.params['studyName'] as string,
      ids
    );
    return null;
  };

  public static deleteAccount: Lifecycle.Method = async (request) => {
    return await ProbandsInteractor.deleteAccount(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.query['deletionType'] as ProbandSelfDeletionType
    );
  };
}
