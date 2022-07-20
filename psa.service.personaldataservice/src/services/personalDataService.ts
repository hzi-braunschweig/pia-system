/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { runTransaction } from '../db';
import { PersonalDataRepository } from '../repositories/personalDataRepository';
import { userserviceClient } from '../clients/userserviceClient';
import { PersonalData, PersonalDataReq } from '../models/personalData';
import { probandAuthClient } from '../clients/authServerClient';
import { assert } from 'ts-essentials';

export class PersonalDataService {
  /**
   * Creates or updates the personal data if the proband exists and is not deactivated
   *
   * @param pseudonym the user the personal data belong to
   * @param personalData the personal data to change
   */
  public static async createOrUpdate(
    pseudonym: string,
    personalData: PersonalDataReq
  ): Promise<PersonalData> {
    const proband = await userserviceClient.getProband(pseudonym);
    if (!proband) {
      throw Boom.notFound('proband does not exist');
    }
    if (!proband.complianceContact) {
      throw Boom.forbidden('proband has refused to be contacted');
    }
    return runTransaction(async (transaction) => {
      const existingPersonalData = await PersonalDataRepository.getPersonalData(
        pseudonym,
        { transaction }
      );
      let result: PersonalData;
      if (existingPersonalData) {
        result = await PersonalDataRepository.updatePersonalData(
          pseudonym,
          personalData,
          { transaction }
        );
      } else {
        result = await PersonalDataRepository.createPersonalData(
          pseudonym,
          proband.study,
          personalData,
          { transaction }
        );
      }
      if (personalData.email) {
        await this.updateAccountMailAddress(pseudonym, personalData.email);
      }
      return result;
    });
  }

  public static async getPersonalData(
    pseudonym: string
  ): Promise<PersonalData | null> {
    return PersonalDataRepository.getPersonalData(pseudonym);
  }

  public static async getPersonalDataEmail(pseudonym: string): Promise<string> {
    const email = await PersonalDataRepository.getPersonalDataEmail(pseudonym);
    if (!email) {
      throw Boom.notFound('No email was found for the requested proband.');
    }
    return email;
  }

  public static async getPersonalDataOfStudies(
    studies: string[]
  ): Promise<PersonalData[]> {
    return await PersonalDataRepository.getPersonalDataOfStudies(studies);
  }

  public static async deletePersonalData(pseudonym: string): Promise<void> {
    return PersonalDataRepository.deletePersonalData(pseudonym);
  }

  private static async updateAccountMailAddress(
    pseudonym: string,
    email: string
  ): Promise<void> {
    // search by username must always return zero or one results
    const [user] = await probandAuthClient.users.find({
      username: pseudonym,
      realm: probandAuthClient.realm,
    });
    assert(
      user?.id && user.username === pseudonym,
      'Could not update personal data. Proband account was not found'
    );
    await probandAuthClient.users.update(
      {
        id: user.id,
        realm: probandAuthClient.realm,
      },
      { email }
    );
  }
}
