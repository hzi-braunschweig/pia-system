/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const sormasClient = require('../../clients/sormasClient');

const statusInteractor = (function () {
  async function setStatus(uuid, status) {
    return sormasClient.setStatus(uuid, status);
  }

  return {
    setStatus: setStatus,
  };
})();

module.exports = statusInteractor;
