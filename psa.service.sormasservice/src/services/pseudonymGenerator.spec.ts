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
    const pseudonym1 = PseudonymGenerator.generateRandomPseudonym('TEST', 8);
    const pseudonym2 = PseudonymGenerator.generateRandomPseudonym('TEST', 8);

    expect(pseudonym1).to.be.not.equal(pseudonym2);
  });

  it('should generate random pseudonyms with custom separator', () => {
    expect(
      PseudonymGenerator.generateRandomPseudonym('TEST-', 8, '#')
    ).to.match(/TEST#\d{8}/);
    expect(
      PseudonymGenerator.generateRandomPseudonym('TEST-', 8, '_')
    ).to.match(/TEST_\d{8}/);
  });

  it('should remove trailing whitespace', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('TEST ', 8)).to.match(
      /TEST-\d{8}/
    );
  });

  it('should remove trailing dashes and underscores', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('TEST-', 8)).to.match(
      /TEST-\d{8}/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST---', 8)).to.match(
      /TEST-\d{8}/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST_', 8)).to.match(
      /TEST-\d{8}/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST___', 8)).to.match(
      /TEST-\d{8}/
    );
  });

  it('should return pseudonym with specified digits', () => {
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 15)).to.match(
      /TEST-\d{15}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 14)).to.match(
      /TEST-\d{14}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 13)).to.match(
      /TEST-\d{13}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 12)).to.match(
      /TEST-\d{12}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 11)).to.match(
      /TEST-\d{11}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 10)).to.match(
      /TEST-\d{10}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 9)).to.match(
      /TEST-\d{9}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 8)).to.match(
      /TEST-\d{8}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 7)).to.match(
      /TEST-\d{7}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 6)).to.match(
      /TEST-\d{6}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 5)).to.match(
      /TEST-\d{5}$/
    );
    expect(PseudonymGenerator.generateRandomPseudonym('TEST', 4)).to.match(
      /TEST-\d{4}$/
    );
  });

  it('should only generate pseudonyms with valid checksums', () => {
    const NUMBER_OF_TRIALS = 1000;
    const regex = /TEST-(\d{4,15})$/;
    for (let numberOfDigits = 4; numberOfDigits <= 15; numberOfDigits++) {
      for (let trial = 0; trial < NUMBER_OF_TRIALS; trial++) {
        const pseudonym = PseudonymGenerator.generateRandomPseudonym(
          'TEST',
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
      PseudonymGenerator.generateRandomPseudonym('TEST', 16);
    expect(functionUnderTest).to.throw();
  });

  it('should throw error if pseudonym has less than minimum digits', () => {
    const functionUnderTest = (): string =>
      PseudonymGenerator.generateRandomPseudonym('TEST', 3);
    expect(functionUnderTest).to.throw();
  });
});
