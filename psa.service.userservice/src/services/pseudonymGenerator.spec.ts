/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai';
import { PseudonymGenerator } from './pseudonymGenerator';
import { assert } from 'ts-essentials';

describe('pseudonymGenerator', () => {
  it('should generate checksum', () => {
    expect(PseudonymGenerator.generateChecksum('12345678')).to.equal(4);
  });

  it('should validate checksum', () => {
    expect(PseudonymGenerator.validateChecksum(21735388)).to.be.true;
    expect(PseudonymGenerator.validateChecksum(21735389)).to.be.false;
    expect(PseudonymGenerator.validateChecksum(42310887)).to.be.true;
    expect(PseudonymGenerator.validateChecksum(42310888)).to.be.false;
    expect(PseudonymGenerator.validateChecksum(92797577)).to.be.true;
    expect(PseudonymGenerator.validateChecksum(48892501)).to.be.true;
    expect(PseudonymGenerator.validateChecksum(84905866)).to.be.true;
    expect(PseudonymGenerator.validateChecksum(64567623)).to.be.true;
    expect(PseudonymGenerator.validateChecksum('00076238')).to.be.true;
  });

  it('should convert number to inverted array', () => {
    expect(PseudonymGenerator.invArray(1234567)).to.deep.equal([
      7, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it('should convert string to inverted array', () => {
    expect(PseudonymGenerator.invArray('1234567')).to.deep.equal([
      7, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it('should generate random pseudonyms', () => {
    const pseudonym1 = PseudonymGenerator.generateRandomPseudonym('test', 8);
    const pseudonym2 = PseudonymGenerator.generateRandomPseudonym('test', 8);

    expect(pseudonym1).to.be.not.equal(pseudonym2);
  });

  it('should generate random pseudonyms with custom separator', () => {
    expect(
      PseudonymGenerator.generateRandomPseudonym('test-', 8, '#')
    ).to.match(/test#\d{8}/);
    expect(
      PseudonymGenerator.generateRandomPseudonym('test-', 8, '_')
    ).to.match(/test_\d{8}/);
  });

  it('should remove trailing whitespace', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('test ', 8)).to.match(
      /test-\d{8}/
    );
  });

  it('should lowercase prefix', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 8)).to.match(
      /test-\d{8}/
    );
  });

  it('should remove trailing dashes and underscores', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('test-', 8)).to.match(
      /test-\d{8}/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test---', 8)).to.match(
      /test-\d{8}/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test_', 8)).to.match(
      /test-\d{8}/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test___', 8)).to.match(
      /test-\d{8}/
    );
  });

  it('should return pseudonym with specified digits', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('test', 15)).to.match(
      /test-\d{15}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 14)).to.match(
      /test-\d{14}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 13)).to.match(
      /test-\d{13}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 12)).to.match(
      /test-\d{12}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 11)).to.match(
      /test-\d{11}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 10)).to.match(
      /test-\d{10}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 9)).to.match(
      /test-\d{9}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 8)).to.match(
      /test-\d{8}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 7)).to.match(
      /test-\d{7}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 6)).to.match(
      /test-\d{6}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 5)).to.match(
      /test-\d{5}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('test', 4)).to.match(
      /test-\d{4}$/
    );
  });

  it('should only generate pseudonyms with valid checksums', () => {
    const NUMBER_OF_TRIALS = 1000;
    const regex = /test-(\d{1,15})$/;
    for (let numberOfDigits = 1; numberOfDigits <= 15; numberOfDigits++) {
      for (let trial = 0; trial < NUMBER_OF_TRIALS; trial++) {
        const pseudonym = PseudonymGenerator.generateRandomPseudonym(
          'test',
          numberOfDigits
        );
        expect(pseudonym).to.match(regex);
        const digits = regex.exec(pseudonym)?.[1];
        assert(digits);
        expect(
          PseudonymGenerator.validateChecksum(digits),
          `Validating checksum for ${pseudonym} failed`
        ).to.be.true;
      }
    }
  });

  it('should throw error if pseudonym has more than maximum digits', () => {
    const functionUnderTest = (): string =>
      PseudonymGenerator.generateRandomPseudonym('test', 16);
    expect(functionUnderTest).to.throw();
  });

  it('should throw error if pseudonym has less than minimum digits', () => {
    const functionUnderTest = (): string =>
      PseudonymGenerator.generateRandomPseudonym('test', 0);
    expect(functionUnderTest).to.throw();
  });
});
