/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import crypto from 'crypto';

const PEPPER = 'supersalt';
const ITERATIONS = 100000;
const KEY_LENGTH = 128;
const SALT_LENGTH = 16;
const TWO = 2;

/**
 * @description helper methods for pw creation and hashes
 */
export class PwHashesHelper {
  /**
   * hashes the password with a given pepper
   * @param password the password to create a hash for
   * @returns the created pw hash
   */
  public static hashThePasswordWithPepper(password: string): string {
    const hash = crypto.createHmac(
      'sha512',
      PEPPER
    ); /** Hashing algorithm sha512 */
    hash.update(password);

    return hash.digest('hex');
  }

  /**
   * hashes the password with a given salt and pepper
   * @param password the password to create a hash for
   * @param salt to randomize the hash
   * @returns the created password hash and the random salt
   */
  public static hashThePasswordWithSaltAndPepper(
    password: string,
    salt: string
  ): string {
    const saltPepper = salt + '' + PEPPER;
    const key = crypto.pbkdf2Sync(
      password,
      saltPepper,
      ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
    return key.toString('hex');
  }

  /**
   * creates sha512 hash from password with a random salt and a given pepper
   * @param {string} password the password to create a hash for
   * @returns {object} the created password hash and the random salt
   */
  public static createHashedPasswordWithSaltAndPepper(password: string): {
    salt: string;
    passwordHash: string;
  } {
    const salt =
      this.genRandomString(SALT_LENGTH); /** Gives us salt of length 16 */
    const passwordHash = this.hashThePasswordWithSaltAndPepper(password, salt);
    return { salt, passwordHash };
  }

  /**
   * returns a random string of the given length
   * @param length the length of the string to get
   * @returns the created random string
   */
  private static genRandomString(length: number): string {
    return crypto
      .randomBytes(Math.ceil(length / TWO))
      .toString('hex') /** convert to hexadecimal format */
      .slice(0, length) /** return required number of characters */
      .toUpperCase();
  }
}
