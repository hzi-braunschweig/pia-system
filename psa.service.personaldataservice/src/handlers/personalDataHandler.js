/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const personalDataInteractor = require('../interactors/personalDataInteractor');
const handleError = require('../handleError');

class PersonalDataHandler {
  /**
   * get personal data for all probands
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<PersonalData[]>}
   */
  static getAll(request) {
    return personalDataInteractor
      .getPersonalDataOfAllProbands(request.auth.credentials)
      .catch((err) =>
        handleError(request, 'Could not get personal data from DB:', err)
      );
  }

  /**
   * gets the personal data for the given proband
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<PersonalData>}
   */
  static getOne(request) {
    return personalDataInteractor
      .getPersonalData(request.auth.credentials, request.params.pseudonym)
      .catch((err) =>
        handleError(request, 'Could not get personal data from DB:', err)
      );
  }

  /**
   * updates the personal data for the given proband
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<PersonalData>}
   */
  static updateOne(request) {
    return personalDataInteractor
      .updatePersonalData(
        request.auth.credentials,
        request.params.pseudonym,
        request.payload
      )
      .catch((err) =>
        handleError(request, 'Could not update user values in DB:', err)
      );
  }
}

module.exports = PersonalDataHandler;
