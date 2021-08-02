/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @description in-memory storage of non-existing, i.e. fake, users to prohibit repeated login attempts
 */

const fakeUserService = (function () {
  const LRU_MAX = 1000;
  let LRU; // List of last fake user names
  let fakeUsers; // Fake users data, indexed by user name

  function initService() {
    LRU = [];
    fakeUsers = {};
  }

  function put(userName, data) {
    const lruPos = LRU.indexOf(userName);
    if (lruPos >= 0) {
      LRU.splice(lruPos, 1);
    } else if (LRU.length >= LRU_MAX) {
      delete fakeUsers[LRU.shift()];
    }
    LRU.push(userName);
    fakeUsers[userName] = data;
  }

  function get(userName) {
    const fakeUser = fakeUsers[userName];
    if (fakeUser) {
      return fakeUser;
    }
    return {
      username: userName,
      role: 'Proband',
      third_wrong_password_at: null,
      number_of_wrong_attempts: 0,
    };
  }

  return {
    /**
     * @function
     * @description initializes the list of fake users
     * @memberof module:fakeUserService
     */
    initService: initService,

    /**
     * @function
     * @description gets data object for fake user from storage
     * @param {string} userName
     * @memberof module:fakeUserService
     */
    get: get,

    /**
     * @function
     * @description puts data object for fake user into storage
     * @param {string} userName
     * @param {object} data
     * @memberof module:fakeUserService
     */
    put: put,
  };
})();

module.exports = fakeUserService;
