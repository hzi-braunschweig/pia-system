/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from 'fs';

export class ConfigUtils {
  /**
   * Reads an environment variable by its name. Throws errors for undefined variables by default.
   * You may either pass a fallback value or ignore undefined variables by setting the env
   * variable IGNORE_MISSING_CONFIG to the value '1'
   * @param key name of environment variable
   * @param fallback value to use if variable is undefined
   */
  public static getEnvVariable(key: string, fallback?: string): string {
    // key is always a string which is literally defined wihtin this class
    // eslint-disable-next-line security/detect-object-injection
    const result = process.env[key];
    if (result === undefined) {
      if (fallback !== undefined) {
        return fallback;
      }
    }
    if (result === undefined) {
      if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
        return '';
      }
      throw new Error(`missing config variable '${key}'`);
    }
    return result;
  }

  /**
   * Reads a numeric environment variable by its name. Throws error if it is not a valid number.
   * @param key name of environment variable
   * @param fallback value to use if variable is undefined
   */
  public static getEnvVariableInt(key: string, fallback?: number): number {
    const result = ConfigUtils.getEnvVariable(key, fallback?.toString());
    const parsed = Number.parseInt(result);
    if (result !== parsed.toString()) {
      if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
        return 0;
      }
      throw new Error(
        `config variable '${key}' is not a valid number '${result}'`
      );
    }
    return parsed;
  }

  public static getFileContent(path: string): Buffer {
    try {
      // path is always a string which is literally defined wihtin this class
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.readFileSync(path);
    } catch (e) {
      if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
        return Buffer.from('');
      }
      throw e;
    }
  }
}
