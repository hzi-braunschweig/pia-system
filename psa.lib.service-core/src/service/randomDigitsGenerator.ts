/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-non-null-assertion,security/detect-object-injection */
/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { randomInt } from 'crypto';

/**
 * Random digits generator with checksum using the Verhoeff algorithm.
 */
export class RandomDigitsGenerator {
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

  public static createInvertedArrayFromNumber(
    digits: number | string
  ): number[] {
    return digits.toString().split('').map(Number).reverse();
  }

  public static generateChecksum(digits: number | string): number {
    let c = 0;
    const invertedArray = this.createInvertedArrayFromNumber(digits);

    for (let i = 0; i < invertedArray.length; i++) {
      c = this.d[c]![this.p[(i + 1) % 8]![invertedArray[i]!]!]!;
    }

    return this.inv[c]!;
  }

  public static validateChecksum(digits: number | string): boolean {
    let c = 0;
    const invertedArray = this.createInvertedArrayFromNumber(digits);

    for (let i = 0; i < invertedArray.length; i++) {
      c = this.d[c]![this.p[i % 8]![invertedArray[i]!]!]!;
    }

    return c === 0;
  }

  /**
   * Generates a random sequence of random digits including leading zeros.
   * To keep leading zeroes the sequence is returned as a string.
   *
   * @param length the length of our sequence, including a checksum
   */
  public static generate(length: number): string {
    const minLength = 2;

    if (length < minLength) {
      throw new Error(
        `Must pass in minimum ${minLength} but provided ${length}`
      );
    }

    const digits = Array.from({ length: length - 1 }, () =>
      randomInt(0, 9)
    ).join('');
    const checksum = this.generateChecksum(digits);

    return `${digits}${checksum}`;
  }
}
