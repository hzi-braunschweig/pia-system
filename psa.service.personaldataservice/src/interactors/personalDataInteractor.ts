/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Boom from '@hapi/boom';
import { AccessToken, assertStudyAccess } from '@pia/lib-service-core';

import { userserviceClient } from '../clients/userserviceClient';
import { PersonalDataService } from '../services/personalDataService';
import { PersonalData, PersonalDataReq } from '../models/personalData';

export class PersonalDataInteractor {
  /**
   * Gets the personal data for the given proband
   */
  public static async getPersonalData(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<PersonalData> {
    const personalData = await PersonalDataService.getPersonalData(pseudonym);

    if (!personalData) {
      throw Boom.notFound('No personal data found for this pseudonym');
    }

    assertStudyAccess(personalData.study, decodedToken);

    return personalData;
  }

  /**
   * Get personal data for all probands
   */
  public static async getPersonalDataOfAllProbands(
    studies: string[]
  ): Promise<PersonalData[]> {
    return await PersonalDataService.getPersonalDataOfStudies(studies);
  }

  /**
   * Updates the personal data for the given proband
   */
  public static async updatePersonalData(
    decodedToken: AccessToken,
    pseudonym: string,
    personalData: PersonalDataReq
  ): Promise<PersonalData> {
    const proband = await userserviceClient.getProband(pseudonym);
    if (!proband) {
      throw Boom.notFound('proband does not exist');
    }
    const studyOfProband = proband.study;
    if (!studyOfProband) {
      throw Boom.notFound('Could not find study of proband');
    }

    assertStudyAccess(studyOfProband, decodedToken);

    return PersonalDataService.createOrUpdate(
      {
        pseudonym,
        complianceContact: proband.complianceContact,
        study: proband.study,
      },
      personalData
    );
  }
}
