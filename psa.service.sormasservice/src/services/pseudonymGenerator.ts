/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { randomInt } from 'crypto';

export class PseudonymGenerator {
  // Multiplication table d
  private static readonly d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];

  // Permutation table p
  private static readonly p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];

  // Inverse table inv
  private static readonly inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  /**
   * Converts string or number to an array and inverts it
   */
  public static invArray(array: string | number): number[] {
    return array.toString().split('').map(Number).reverse();
  }

  /**
   * Generates checksum according to Verhoeff algorithm
   */
  public static generateChecksum(array: number | string): number {
    let c = 0;
    const invertedArray = PseudonymGenerator.invArray(array);

    for (let i = 0; i < invertedArray.length; i++) {
      c =
        PseudonymGenerator.d[c]![
          PseudonymGenerator.p[(i + 1) % 8]![invertedArray[i]!]!
        ]!;
    }

    return PseudonymGenerator.inv[c]!;
  }

  /**
   * Validates checksum according to Verhoeff algorithm
   */
  public static validateChecksum(array: number | string): boolean {
    let c = 0;
    const invertedArray = PseudonymGenerator.invArray(array);

    for (let i = 0; i < invertedArray.length; i++) {
      c =
        PseudonymGenerator.d[c]![
          PseudonymGenerator.p[i % 8]![invertedArray[i]!]!
        ]!;
    }

    return c === 0;
  }

  /**
   * Generates a random pseudonym consisting of prefix, number of digits and separator (defaults to '-')
   *
   * @param prefix the prefix for the pseudonym
   * @param digits the number of digits including the checksum (min: 4; max: 15)
   * @param separator the seperator between the prefix and the digits
   * @example ("PIA", 8) would generate a pseudonmy similar to PIA-92445205
   */
  public static generateRandomPseudonym(
    prefix: string,
    digits: number, // Including checksum
    separator = '-'
  ): string {
    const maxDigits = 15; // Including checksum
    const minDigits = 4; // Including checksum

    if (digits > maxDigits) {
      throw new Error(
        `Only allowed to pass in max ${maxDigits} but provided ${digits}`
      );
    } else if (digits < minDigits) {
      throw new Error(
        `Must pass in minimum ${minDigits} but provided ${digits}`
      );
    }

    const randomNumber = Array.from({ length: digits - 1 }, () =>
      randomInt(0, 9)
    ).join('');

    prefix = prefix.replace(/([-_])*\s*$/gi, '');

    return (
      prefix +
      separator +
      randomNumber +
      PseudonymGenerator.generateChecksum(randomNumber).toString()
    );
  }
}
