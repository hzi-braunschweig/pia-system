/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');

const userserviceClient = require('../clients/userserviceClient');
const personalDataService = require('../services/personalDataService');

class PersonalDataInteractor {
  /**
   * gets the personal data for the given proband
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {string} pseudonym the id of the proband to get data for
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async getPersonalData(decodedToken, pseudonym) {
    const userRole = decodedToken.role;
    const studies = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    const personalData = await personalDataService.getPersonalData(pseudonym);
    if (!personalData || !studies.includes(personalData.study)) {
      throw Boom.notFound('No personal data found for this pseudonym');
    }
    return personalData;
  }

  /**
   * get personal data for all probands
   * @param {AccessToken} decodedToken the jwt of the request
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async getPersonalDataOfAllProbands(decodedToken) {
    const userRole = decodedToken.role;
    const studies = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    return await personalDataService.getPersonalDataOfStudies(studies);
  }

  /**
   * updates the personal data for the given proband
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {string} pseudonym the pseudonym of the proband that should be updated
   * @param {object} personalData the personal data to change
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async updatePersonalData(decodedToken, pseudonym, personalData) {
    const userRole = decodedToken.role;
    const studies = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    const primaryStudy = await userserviceClient.getPrimaryStudy(pseudonym);
    if (!studies.includes(primaryStudy.name)) {
      throw Boom.notFound(
        'The given pseudonym could not be found in the studies you have access to.'
      );
    }
    return personalDataService.createOrUpdate(
      pseudonym,
      primaryStudy.name,
      personalData
    );
  }
}

module.exports = PersonalDataInteractor;
