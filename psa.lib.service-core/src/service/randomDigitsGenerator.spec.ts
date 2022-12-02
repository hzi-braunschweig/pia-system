/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai';
import { RandomDigitsGenerator } from './randomDigitsGenerator';

describe('RandomDigitsGenerator', () => {
  it('should generate checksum', () => {
    expect(RandomDigitsGenerator.generateChecksum(12345678)).to.equal(4);
  });

  it('should validate checksum', () => {
    expect(RandomDigitsGenerator.validateChecksum(21735388)).to.be.true;
    expect(RandomDigitsGenerator.validateChecksum(21735389)).to.be.false;
    expect(RandomDigitsGenerator.validateChecksum(42310887)).to.be.true;
    expect(RandomDigitsGenerator.validateChecksum(42310888)).to.be.false;
    expect(RandomDigitsGenerator.validateChecksum(92797577)).to.be.true;
    expect(RandomDigitsGenerator.validateChecksum(48892501)).to.be.true;
    expect(RandomDigitsGenerator.validateChecksum(84905866)).to.be.true;
    expect(RandomDigitsGenerator.validateChecksum(64567623)).to.be.true;
    expect(RandomDigitsGenerator.validateChecksum('00076238')).to.be.true;
  });

  it('should convert number to inverted array', () => {
    expect(
      RandomDigitsGenerator.createInvertedArrayFromNumber(1234567)
    ).to.deep.equal([7, 6, 5, 4, 3, 2, 1]);
  });

  it('should generate different random numbers', () => {
    const digitsA = RandomDigitsGenerator.generate(8);
    const digitsB = RandomDigitsGenerator.generate(8);

    expect(digitsA).to.be.not.equal(digitsB);
    expect(digitsA.length).to.equal(8);
    expect(digitsB.length).to.equal(8);
  });

  it('should return random sequence of digits with specified length', () => {
    for (let length = 2; length <= 15; length++) {
      const digits = RandomDigitsGenerator.generate(length);
      expect(
        digits.length,
        `${digits} was not ${length} digits in length.`
      ).to.eq(length);
    }
  });

  it('should only generate sequences with valid checksums', () => {
    const NUMBER_OF_TRIALS = 1000;
    for (let length = 2; length <= 15; length++) {
      for (let trial = 0; trial < NUMBER_OF_TRIALS; trial++) {
        const digits = RandomDigitsGenerator.generate(length);
        expect(
          RandomDigitsGenerator.validateChecksum(digits),
          `Validating checksum for ${digits} failed`
        ).to.be.true;
      }
    }
  });

  it('should throw error if pseudonym has less than minimum digits', () => {
    const functionUnderTest = (): string => RandomDigitsGenerator.generate(1);
    expect(functionUnderTest).to.throw();
  });
});
