/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const statusInteractor = require('../../interactors/internal/statusInteractor');

/**
 * @description HAPI Handler for setting the status
 */
const statusHandler = function () {
  async function setStatus(request) {
    console.log(
      'Got setStatus request for ' + request.payload.uuid.substr(0, 6) + '...'
    );
    return statusInteractor.setStatus(
      request.payload.uuid,
      request.payload.status
    );
  }

  return {
    setStatus: setStatus,
  };
};

module.exports = statusHandler();
