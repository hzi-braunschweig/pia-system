/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const crypto = require('crypto');

const PEPPER = 'supersalt';

/**
 * @description helper methods for pw creation and hashes
 */
const pwHashesHelper = (function () {
  const genRandomString = (length) => {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex') /** convert to hexadecimal format */
      .slice(0, length) /** return required number of characters */
      .toUpperCase();
  };

  const hashThePasswordWithPepper = (password) => {
    const hash = crypto.createHmac(
      'sha512',
      PEPPER
    ); /** Hashing algorithm sha512 */
    hash.update(password);

    const value = hash.digest('hex');
    return {
      passwordHash: value,
    };
  };

  const hashThePasswordWithSaltAndPepper = (password, salt) => {
    const saltPepper = salt + '' + PEPPER;
    const key = crypto.pbkdf2Sync(password, saltPepper, 100000, 128, 'sha512');
    const value = key.toString('hex');
    return {
      salt: salt,
      passwordHash: value,
    };
  };

  const createHashedPasswordWithSaltAndPepper = (password) => {
    const salt = genRandomString(16); /** Gives us salt of length 16 */
    return hashThePasswordWithSaltAndPepper(password, salt);
  };

  return {
    /**
     * @function
     * @description creates sha512 hash from password with a random salt and a given pepper
     * @memberof module:pwHashesHelper
     * @param {string} password the password to create a hash for
     * @returns {object} the created password hash and the random salt
     */
    createHashedPasswordWithSaltAndPepper:
      createHashedPasswordWithSaltAndPepper,

    /**
     * @function
     * @description hashes the password with a given pepper
     * @memberof module:pwHashesHelper
     * @param {string} password the password to create a hash for
     * @returns {object} the created pw hash
     */
    hashThePasswordWithPepper: hashThePasswordWithPepper,

    /**
     * @function
     * @description hashes the password with a given salt and pepper
     * @memberof module:pwHashesHelper
     * @param {string} password the password to create a hash for
     * @param {string} salt to randomize the hash
     * @returns {object} the created password hash and the random salt
     */
    hashThePasswordWithSaltAndPepper: hashThePasswordWithSaltAndPepper,

    /**
     * @function
     * @description returns a random string of the given length
     * @memberof module:pwHashesHelper
     * @param {number} length the length of the string to get
     * @returns {string} the created random string
     */
    genRandomString: genRandomString,
  };
})();

module.exports = pwHashesHelper;
