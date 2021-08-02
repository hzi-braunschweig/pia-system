/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const systemLogInteractor = require('../interactors/systemLogInteractor');

class SystemLogHandler {
  /**
   *
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<SystemLogRes[]>}
   */
  static async getSystemLogs(request) {
    return systemLogInteractor.getSystemLogs(
      request.auth.credentials,
      request.query
    );
  }
}

module.exports = SystemLogHandler;
