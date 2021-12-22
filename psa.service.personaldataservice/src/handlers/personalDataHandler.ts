/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import personalDataInteractor from '../interactors/personalDataInteractor';
import handleError from '../handleError';
import { Lifecycle } from '@hapi/hapi';
import { PersonalDataReq } from '../models/personalData';

export class PersonalDataHandler {
  /**
   * get personal data for all probands
   */
  public static getAll: Lifecycle.Method = async (request) => {
    return personalDataInteractor
      .getPersonalDataOfAllProbands(request.auth.credentials)
      .catch((err) =>
        handleError(request, 'Could not get personal data from DB:', err)
      );
  };

  /**
   * gets the personal data for the given proband
   */
  public static getOne: Lifecycle.Method = async (request) => {
    return personalDataInteractor
      .getPersonalData(
        request.auth.credentials,
        request.params['pseudonym'] as string
      )
      .catch((err) =>
        handleError(request, 'Could not get personal data from DB:', err)
      );
  };

  /**
   * updates the personal data for the given proband
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    return personalDataInteractor
      .updatePersonalData(
        request.auth.credentials,
        request.params['pseudonym'] as string,
        request.payload as PersonalDataReq
      )
      .catch((err) =>
        handleError(request, 'Could not update user values in DB:', err)
      );
  };
}
