/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MaterialInteractor } from '../interactors/materialInteractor';
import { Request } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';

export class MaterialHandler {
  public static async requestNewMaterial(
    this: void,
    request: Request
  ): Promise<unknown> {
    return MaterialInteractor.requestNewMaterial(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    );
  }
}
