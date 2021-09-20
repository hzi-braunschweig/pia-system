/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @description interactor that handles user requests based on users permissions
 */
const probandsToContactInteractor = (function () {
  async function getProbandsToContact(decodedToken, pgHelper) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
        return pgHelper.getProbandsToContact(requester).catch((err) => {
          console.log(err);
          throw new Error('Could not get the probands to contact');
        });
      default:
        throw new Error(
          'Could not get probands to contact: Unknown or wrong role'
        );
    }
  }

  async function updateProbandsToContact(decodedToken, id, data, pgHelper) {
    const userRole = decodedToken.role;

    switch (userRole) {
      case 'ProbandenManager':
        return pgHelper.updateProbandToContact(id, data).catch((err) => {
          console.log(err);
          throw new Error(
            'The proband to contact could not be updated: ' + err
          );
        });
      default:
        throw new Error(
          'Could not get the pending deletion: Unknown or wrong role'
        );
    }
  }

  return {
    /**
     * @function
     * @description gets the probands from DB
     * @memberof module:probandsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {string} user_id the id of the planned proband to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getProbandsToContact: getProbandsToContact,

    /**
     * @function
     * @description updates a the probands to contact in DB
     * @memberof module:probandsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {string} user_id the id of the proband to get
     * @param {object} data the new values
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateProbandsToContact: updateProbandsToContact,
  };
})();

module.exports = probandsToContactInteractor;
