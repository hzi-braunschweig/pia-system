/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Boom from '@hapi/boom';
import { PersonalDataService } from '../../services/personalDataService';
import { PersonalData, PersonalDataReq } from '../../models/personalData';
import { userserviceClient } from '../../clients/userserviceClient';

export class InternalPersonalDataInteractor {
  /**
   * Creates or updates the personal data if the proband exists and is not deactivated
   */
  public static async createOrUpdate(
    pseudonym: string,
    personalData: PersonalDataReq,
    skipUpdateAccount: boolean
  ): Promise<PersonalData> {
    const proband = await userserviceClient.getProband(pseudonym);
    if (!proband) {
      throw Boom.notFound('proband does not exist');
    }
    return PersonalDataService.createOrUpdate(
      {
        pseudonym,
        complianceContact: proband.complianceContact,
        study: proband.study,
      },
      personalData,
      skipUpdateAccount
    );
  }

  /**
   * Delete the personal data of a proband
   */
  public static async deletePersonalData(pseudonym: string): Promise<void> {
    return PersonalDataService.deletePersonalData(pseudonym);
  }

  /**
   * Gets the email from the personal data of the given proband
   */
  public static async getPersonalDataEmail(pseudonym: string): Promise<string> {
    return PersonalDataService.getPersonalDataEmail(pseudonym);
  }
}
