/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle, Request } from '@hapi/hapi';
import { PersonalData, PersonalDataReq } from '../../models/personalData';

import { InternalPersonalDataInteractor } from '../../interactors/internal/internalPersonalDataInteractor';
import { handleError } from '../../handleError';
import { PersonalDataInteractor } from '../../interactors/personalDataInteractor';

export class InternalPersonalDataHandler {
  /**
   * Updates or creates a personal data entry
   */
  public static createOrUpdate: Lifecycle.Method = async (
    request: Request
  ): Promise<PersonalData> => {
    return InternalPersonalDataInteractor.createOrUpdate(
      request.params['pseudonym'] as string,
      request.payload as PersonalDataReq,
      request.query['skipUpdateAccount'] as boolean
    ).catch((err: Error) =>
      handleError(request, 'Could not update user values in DB:', err)
    );
  };

  /**
   * Deletes the personal data of a proband
   */
  public static deleteOne: Lifecycle.Method = async (
    request: Request
  ): Promise<null> => {
    return InternalPersonalDataInteractor.deletePersonalData(
      request.params['username'] as string
    )
      .then(() => null)
      .catch((err: Error) =>
        handleError(request, 'Could not delete personal data in DB:', err)
      );
  };

  /**
   * Gets the email from the personal data of the given proband
   */
  public static getEmail: Lifecycle.Method = async (
    request: Request
  ): Promise<string> => {
    return InternalPersonalDataInteractor.getPersonalDataEmail(
      request.params['username'] as string
    ).catch((err: Error) => handleError(request, 'Could get email:', err));
  };

  /**
   * Get personal data for all probands of a study
   */
  public static readonly getAllOfStudy: Lifecycle.Method = async (request) => {
    return PersonalDataInteractor.getPersonalDataOfAllProbands([
      request.params['studyName'] as string,
    ]).catch((err: Error) =>
      handleError(request, 'Could not get personal data from DB:', err)
    );
  };
}
