/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const userLogRepository = require('../../repositories/userLogRepository');

class InternalUserLogInteractor {
  static async postLog(user_id, log) {
    return await userLogRepository.postLog(user_id, log);
  }

  /**
   *
   * @param {string} userId
   * @param {UserLogFilter} filter
   * @return {Promise<null>}
   */
  static async deleteLog(userId, filter) {
    return await userLogRepository.deleteLog(userId, filter);
  }
}

module.exports = InternalUserLogInteractor;
