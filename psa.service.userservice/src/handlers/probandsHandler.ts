/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { ProbandsInteractor } from '../interactors/probandsInteractor';
import { AccessToken } from '@pia/lib-service-core';

export class ProbandsHandler {
  public static getAll: Lifecycle.Method = async (request) => {
    const studyName = request.params['studyName'] as string;
    const token = request.auth.credentials as AccessToken;

    return await ProbandsInteractor.getAllProbandsOfStudy(studyName, token);
  };
}
