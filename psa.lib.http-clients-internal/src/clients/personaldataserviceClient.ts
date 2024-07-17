/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import { PendingPersonalDataDeletion } from '../dtos/pendingDeletion';
import {
  PersonalDataInternalDto,
  PersonalDataInternalDtoGet,
} from '../dtos/personalData';

export class PersonaldataserviceClient extends ServiceClient {
  /**
   * Updates the personal data for the proband with the given pseudonym
   */
  public async updatePersonalData(
    pseudonym: string,
    personalData: PersonalDataInternalDto,
    skipUpdateAccount = false
  ): Promise<void> {
    let query = '';
    if (skipUpdateAccount) {
      query = '?skipUpdateAccount=true';
    }
    return await this.httpClient.put(
      `/personal/personalData/proband/${pseudonym}${query}`,
      personalData
    );
  }

  /**
   * Gets the email of the proband based on the given username
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
   * Gets the personal data of all probands of the given study
   */
  public async getPersonalData(
    studyName: string
  ): Promise<PersonalDataInternalDtoGet[]> {
    return await this.httpClient.get(
      `/personal/personalData/study/${encodeURIComponent(studyName)}`
    );
  }

  /**
   * Gets the pending deletions of all probands of the given study
   */
  public async getPendingPersonalDataDeletions(
    studyName: string
  ): Promise<PendingPersonalDataDeletion[]> {
    return await this.httpClient.get(
      `/personal/studies/${encodeURIComponent(studyName)}/pendingdeletions`
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
