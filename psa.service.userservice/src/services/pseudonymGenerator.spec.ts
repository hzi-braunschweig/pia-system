/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai';
import { PseudonymGenerator } from './pseudonymGenerator';

describe('pseudonymGenerator', () => {
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
