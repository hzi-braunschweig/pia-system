/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-non-null-assertion,security/detect-object-injection */

import { RandomDigitsGenerator } from '@pia/lib-service-core';

export class PseudonymGenerator {
  /**
   * Generates a random pseudonym consisting of prefix, number of digits and separator (defaults to '-')
   *
   * @param prefix the prefix for the pseudonym
   * @param digits the number of digits including the checksum (min: 1; max: 15)
   * @param separator the separator between the prefix and the digits
   * @example ("PIA", 8) would generate a pseudonym similar to PIA-92445205
   */
  public static generateRandomPseudonym(
    prefix: string,
    digits: number,
    separator = '-'
  ): string {
    const maxDigitsIncludingChecksum = 15;

    if (digits > maxDigitsIncludingChecksum) {
      throw new Error(
        `Only allowed to pass in max ${maxDigitsIncludingChecksum} but provided ${digits}`
      );
    }

    prefix = prefix.toLowerCase().replace(/([-_])*\s*$/gi, '');

    return prefix + separator + RandomDigitsGenerator.generate(digits);
  }
}
