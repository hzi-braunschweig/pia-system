/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const postgresqlHelper = require('../services/postgresqlHelper');
const materialInteractor = require('../interactors/materialInteractor');

/**
 * @description HAPI Handler for material
 */
const materialHandler = (function () {
  function requestNewMaterial(request) {
    return materialInteractor.requestNewMaterial(
      request.auth.credentials,
      request.params.username,
      postgresqlHelper
    );
  }

  return {
    /**
     * @function
     * @description creates request for new material
     * @memberof module:materialHandler
     */
    requestNewMaterial: requestNewMaterial,
  };
})();

module.exports = materialHandler;
