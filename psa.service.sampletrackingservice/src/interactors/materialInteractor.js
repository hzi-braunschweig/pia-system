/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');

const postgresqlHelper = require('../services/postgresqlHelper');

/**
 * @description interactor that handles material requests based on users permissions
 */
const materialInteractor = (function () {
  function requestNewMaterial(decodedToken, username) {
    const userRole = decodedToken.role;
    const usernameToken = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        if (username !== usernameToken) {
          return Boom.forbidden('Wrong user for this command');
        } else {
          return postgresqlHelper
            .requestNewMaterialFor(username)
            .catch((err) => {
              console.log(err);
              return Boom.internal(
                'Could not request new material for the proband: internal DB error: ',
                err
              );
            });
        }
      default:
        return Boom.forbidden('Wrong role for this command');
    }
  }

  return {
    /**
     * @function
     * @description request new material
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    requestNewMaterial: requestNewMaterial,
  };
})();

module.exports = materialInteractor;
