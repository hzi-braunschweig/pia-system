/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import Boom from '@hapi/boom';

import { AccessToken } from '@pia/lib-service-core';
import { ProbandsToContactInteractor } from '../interactors/probandsToContactInteractor';
import { ProbandsToContactRequest } from '../models/probandsToContact';

/**
 * @description HAPI Handler for planned probands
 */
export class ProbandsToContactHandler {
  public static getProbandsToContact: Lifecycle.Method = async (request) => {
    return ProbandsToContactInteractor.getProbandsToContact(
      request.auth.credentials as AccessToken
    ).catch((err) => {
      console.log('Could not get users from DB: ' + (err as Error).toString());
      return Boom.notFound((err as Error).toString());
    });
  };

  public static updateOne: Lifecycle.Method = async (request) => {
    await ProbandsToContactInteractor.updateProbandsToContact(
      request.params['id'] as number,
      request.payload as ProbandsToContactRequest
    ).catch((err) => {
      console.log(
        'Could update probands to contact in DB: ' + (err as Error).toString()
      );
      return Boom.notFound((err as Error).toString());
    });
    return null;
  };
}
