/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { PersonalDataService } = require('../../services/personalDataService');

class InternalPersonalDataInteractor {
  /**
   * Creates or updates the personal data if the proband exists and is not deactivated
   *
   * @param {string} pseudonym the user the personal data belong to
   * @param {PersonalDataReq} personalData the personal data to change
   * @returns {Promise<PersonalData>}
   */
  static async createOrUpdate(pseudonym, personalData) {
    return PersonalDataService.createOrUpdate(pseudonym, personalData);
  }

  /**
   * Delete the personal data of a proband
   *
   * @param {string} username the user the personal data belong to
   * @returns {Promise<void>}
   */
  static async deletePersonalData(username) {
    return PersonalDataService.deletePersonalData(username);
  }

  /**
   * Gets the email from the personal data of the given proband
   * @param username
   * @return {Promise<string>}
   */
  static async getPersonalDataEmail(username) {
    return PersonalDataService.getPersonalDataEmail(username);
  }
}

module.exports = InternalPersonalDataInteractor;
