/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const userLogInteractor = require('../interactors/userLogInteractor');

class UserLogHandler {
  static async getLogs(request) {
    return userLogInteractor.getLogsFor(
      request.auth.credentials,
      request.payload
    );
  }
}

module.exports = UserLogHandler;
