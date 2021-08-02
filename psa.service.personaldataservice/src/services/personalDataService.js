/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { runTransaction } = require('../db');
const personalDataRepository = require('../repositories/personalDataRepository');
const userserviceClient = require('../clients/userserviceClient');

class PersonalDataService {
  /**
   * Creates or updates the personal data if the proband exists and is not deactivated
   *
   * @param {string} pseudonym the user the personal data belong to
   * @param {string} study name of the study, the user belongs to
   * @param {PersonalDataReq} personalData the personal data to change
   * @returns {Promise<PersonalData>}
   */
  static async createOrUpdate(pseudonym, study, personalData) {
    const proband = await userserviceClient.getProband(pseudonym);
    if (!proband) {
      throw Boom.notFound('proband does not exist');
    }
    if (proband.account_status === 'deactivated') {
      throw Boom.notFound('proband was deactivated');
    }
    return runTransaction(async (transaction) => {
      const existingPersonalData = await personalDataRepository.getPersonalData(
        pseudonym,
        { transaction }
      );
      if (existingPersonalData) {
        return await personalDataRepository.updatePersonalData(
          pseudonym,
          personalData,
          { transaction }
        );
      } else {
        return await personalDataRepository.createPersonalData(
          pseudonym,
          study,
          personalData,
          { transaction }
        );
      }
    });
  }

  static async getPersonalData(pseudonym) {
    return personalDataRepository.getPersonalData(pseudonym);
  }

  static async getPersonalDataEmail(pseudonym) {
    const email = await personalDataRepository.getPersonalDataEmail(pseudonym);
    if (!email) {
      throw Boom.notFound('No email was found for the requested proband.');
    }
    return email;
  }

  static async getPersonalDataOfStudies(studies) {
    return await personalDataRepository.getPersonalDataOfStudies(studies);
  }

  static async deletePersonalData(username) {
    return personalDataRepository.deletePersonalData(username);
  }
}

module.exports = PersonalDataService;
