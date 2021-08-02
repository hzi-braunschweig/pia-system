/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const crypto = require('crypto');
const generator = require('generate-password');
const { config } = require('../config');

/**
 * @description helper methods for pw creation and hashes
 */
const pwGenService = (function () {
  const genRandomString = (length) => {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex') /** convert to hexadecimal format */
      .slice(0, length) /** return required number of characters */
      .toUpperCase();
  };

  const genRandomPw = () => {
    let passwordLength = 12;
    if (config.userPasswordLength) {
      const pwdLength = config.userPasswordLength;
      passwordLength = pwdLength >= 12 ? pwdLength : 12;
    }

    return generator.generate({
      length: passwordLength,
      numbers: true,
      symbols: true,
      uppercase: true,
      strict: true,
      exclude: '\\^`´"\'IloO0[]| <>~',
    });
  };

  return {
    /**
     * @function
     * @description returns a random string of the given length
     * @memberof module:pwGenService
     * @param {number} length the length of the string to get
     * @returns {string} the created random string
     */
    genRandomString: genRandomString,

    /**
     * @function
     * @description returns a random password with requirenments
     * @memberof module:pwGenService
     * @returns {string} the created random password
     */
    genRandomPw: genRandomPw,
  };
})();

module.exports = pwGenService;
