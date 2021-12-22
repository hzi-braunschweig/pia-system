/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import { PersonalDataInternalDto } from '../dtos/personalData';

export class PersonaldataserviceClient extends ServiceClient {
  /**
   * Updates the personal data for the proband with the given pseudonym
   */
  public async updatePersonalData(
    pseudonym: string,
    personalData: PersonalDataInternalDto
  ): Promise<void> {
    return await this.httpClient.put(
      `/personal/personalData/proband/${pseudonym}`,
      personalData
    );
  }

  /**
   * Deletes the personal data of the proband based on the given username
   */
  public async getPersonalDataEmail(pseudonym: string): Promise<string | null> {
    return await this.httpClient.get(
      `/personal/personalData/proband/${pseudonym}/email`,
      {
        responseType: 'text',
        returnNullWhenNotFound: true,
      }
    );
  }

  /**
   * Deletes the personal data of the proband based on the given pseudonym
   */
  public async deletePersonalDataOfUser(pseudonym: string): Promise<void> {
    return await this.httpClient.delete(
      `/personal/personalData/proband/${pseudonym}`
    );
  }
}
