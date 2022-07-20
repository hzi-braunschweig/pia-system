/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { AccessToken } from 'dist/src';

import * as postgresqlHelper from '../services/postgresqlHelper';

/**
 * @description interactor that handles material requests based on users permissions
 */
export class MaterialInteractor {
  /**
   * request new material
   */
  public static async requestNewMaterial(
    decodedToken: AccessToken,
    username: string
  ): Promise<null> {
    if (username !== decodedToken.username) {
      throw Boom.forbidden('Wrong user for this command');
    }
    return postgresqlHelper.requestNewMaterialFor(username).catch((err) => {
      console.log(err);
      throw Boom.internal(
        'Could not request new material for the proband: internal DB error: ',
        err
      );
    });
  }
}
