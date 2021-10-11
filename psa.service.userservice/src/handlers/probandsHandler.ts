/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { ProbandsInteractor } from '../interactors/probandsInteractor';
import { AccessToken } from '@pia/lib-service-core';
import {
  CreateIDSProbandRequest,
  CreateProbandRequest,
} from '../models/proband';
import { config } from '../config';
import Boom from '@hapi/boom';

interface AuthRequestFromExternal {
  apiKey: string;
  ut_email: string;
}

export class ProbandsHandler {
  public static getAll: Lifecycle.Method = async (request) => {
    const studyName = request.params['studyName'] as string;
    const token = request.auth.credentials as AccessToken;

    return await ProbandsInteractor.getAllProbandsOfStudy(studyName, token);
  };

  /**
   * creates the proband if it does not exist
   * @param request
   */
  public static createProband: Lifecycle.Method = async (request) => {
    const token = request.auth.credentials as AccessToken;
    const studyName = request.params['studyName'] as string;
    const probandRequest = request.payload as CreateProbandRequest;

    await ProbandsInteractor.createProband(studyName, probandRequest, token);
    return null;
  };

  /**
   * creates the proband if it does not exist from an external system using apiKey
   * @param request
   */
  public static createProbandFromExternal: Lifecycle.Method = (request) => {
    const requester = request.payload as AuthRequestFromExternal;
    const probandRequest = request.payload as CreateProbandRequest;
    if (requester.apiKey !== config.apiKey) {
      return Boom.unauthorized('invalid authentication');
    }
    return ProbandsInteractor.createProbandFromExternal(
      config.studyForExternalSystem,
      probandRequest,
      requester.ut_email
    );
  };

  /**
   * creates the ids proband if it does not exist
   * @param request
   */
  public static createIDSProband: Lifecycle.Method = async (request) => {
    const token = request.auth.credentials as AccessToken;
    const studyName = request.params['studyName'] as string;
    const payload = request.payload as CreateIDSProbandRequest;

    await ProbandsInteractor.createIDSProband(studyName, payload.ids, token);
    return null;
  };
}
