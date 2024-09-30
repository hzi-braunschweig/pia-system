/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PersonalDataInteractor } from '../interactors/personalDataInteractor';
import { handleError } from '../handleError';
import { Lifecycle } from '@hapi/hapi';
import { PersonalDataReq } from '../models/personalDataDb';
import { AccessToken } from '@pia/lib-service-core';

export class PersonalDataHandler {
  /**
   * Get personal data for all probands
   */
  public static getAll: Lifecycle.Method = async (request) => {
    const { studies } = request.auth.credentials as AccessToken;

    return PersonalDataInteractor.getPersonalDataOfAllProbands(studies).catch(
      (err: Error) =>
        handleError(request, 'Could not get personal data from DB:', err)
    );
  };

  /**
   * Gets the personal data for the given proband
   */
  public static getOne: Lifecycle.Method = async (request) => {
    return PersonalDataInteractor.getPersonalData(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch((err: Error) =>
      handleError(request, 'Could not get personal data from DB:', err)
    );
  };

  /**
   * Updates the personal data for the given proband
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    return PersonalDataInteractor.updatePersonalData(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.payload as PersonalDataReq
    ).catch((err: Error) =>
      handleError(request, 'Could not update user values in DB:', err)
    );
  };
}
