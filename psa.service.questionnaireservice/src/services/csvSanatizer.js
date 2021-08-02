/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

class CsvSanatizer {
  /**
   * Removes characters with a potential for CSV injection.
   * See: https://owasp.org/www-community/attacks/CSV_Injection
   *
   * @param string
   * @returns {string}
   */
  static removeMaliciousChars(string) {
    const csvInjectionChars = ['=', '+', '-', '@'];

    if (csvInjectionChars.includes(string.charAt(0))) {
      return CsvSanatizer.removeMaliciousChars(string.substring(1));
    } else {
      return string;
    }
  }
}

module.exports = CsvSanatizer;
