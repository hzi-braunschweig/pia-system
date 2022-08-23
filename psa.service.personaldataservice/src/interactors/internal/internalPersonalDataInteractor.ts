/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PersonalDataService } from '../../services/personalDataService';
import { PersonalData, PersonalDataReq } from '../../models/personalData';

export class InternalPersonalDataInteractor {
  /**
   * Creates or updates the personal data if the proband exists and is not deactivated
   */
  public static async createOrUpdate(
    pseudonym: string,
    personalData: PersonalDataReq
  ): Promise<PersonalData> {
    return PersonalDataService.createOrUpdate(pseudonym, personalData);
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
