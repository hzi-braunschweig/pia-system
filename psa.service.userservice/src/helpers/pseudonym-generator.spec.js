/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const expect = require('chai').expect;
const {
  generateChecksum,
  validateChecksum,
  invArray,
  generateRandomPseudonym,
} = require('./pseudonym-generator');

describe('pseudonym-generator', () => {
  it('should generate checksum', () => {
    const result = generateChecksum(12345678);
    expect(result).to.be.ok;
  });

  it('should validate checksum', () => {
    expect(validateChecksum(21735388)).to.be.true;
    expect(validateChecksum(21735389)).to.be.false;
    expect(validateChecksum(42310887)).to.be.true;
    expect(validateChecksum(42310888)).to.be.false;
    expect(validateChecksum(92797577)).to.be.true;
    expect(validateChecksum(48892501)).to.be.true;
    expect(validateChecksum(84905866)).to.be.true;
    expect(validateChecksum(64567623)).to.be.true;
  });

  it('should convert number to inverted array', () => {
    expect(invArray(1234567)).to.deep.equal([7, 6, 5, 4, 3, 2, 1]);
  });

  it('should convert string to inverted array', () => {
    expect(invArray('1234567')).to.deep.equal([7, 6, 5, 4, 3, 2, 1]);
  });

  it('should generate random pseudonyms', () => {
    const pseudonym1 = generateRandomPseudonym('TEST', 8);
    const pseudonym2 = generateRandomPseudonym('TEST', 8);

    expect(pseudonym1).to.be.not.equal(pseudonym2);
  });

  it('should generate random pseudonyms with custom separator', () => {
    expect(generateRandomPseudonym('TEST-', 8, '#')).to.match(/TEST#(\d){8}/);
    expect(generateRandomPseudonym('TEST-', 8, '_')).to.match(/TEST_(\d){8}/);
  });

  it('should remove trailing whitespace', () => {
    expect(generateRandomPseudonym('TEST ', 8)).to.match(/TEST-(\d){8}/);
  });

  it('should remove trailing dashes and underscores', () => {
    expect(generateRandomPseudonym('TEST-', 8)).to.match(/TEST-(\d){8}/);
    expect(generateRandomPseudonym('TEST---', 8)).to.match(/TEST-(\d){8}/);
    expect(generateRandomPseudonym('TEST_', 8)).to.match(/TEST-(\d){8}/);
    expect(generateRandomPseudonym('TEST___', 8)).to.match(/TEST-(\d){8}/);
  });

  it('should return pseudonym with specified digits', () => {
    expect(generateRandomPseudonym('TEST', 15)).to.match(/TEST-(\d){15}$/);
    expect(generateRandomPseudonym('TEST', 14)).to.match(/TEST-(\d){14}$/);
    expect(generateRandomPseudonym('TEST', 13)).to.match(/TEST-(\d){13}$/);
    expect(generateRandomPseudonym('TEST', 12)).to.match(/TEST-(\d){12}$/);
    expect(generateRandomPseudonym('TEST', 11)).to.match(/TEST-(\d){11}$/);
    expect(generateRandomPseudonym('TEST', 10)).to.match(/TEST-(\d){10}$/);
    expect(generateRandomPseudonym('TEST', 9)).to.match(/TEST-(\d){9}$/);
    expect(generateRandomPseudonym('TEST', 8)).to.match(/TEST-(\d){8}$/);
    expect(generateRandomPseudonym('TEST', 7)).to.match(/TEST-(\d){7}$/);
    expect(generateRandomPseudonym('TEST', 6)).to.match(/TEST-(\d){6}$/);
    expect(generateRandomPseudonym('TEST', 5)).to.match(/TEST-(\d){5}$/);
    expect(generateRandomPseudonym('TEST', 4)).to.match(/TEST-(\d){4}$/);
  });

  it('should throw error if pseudonym has more than maximum digits', () => {
    const functionUnderTest = () => generateRandomPseudonym('TEST', 16);
    expect(functionUnderTest).to.throw();
  });

  it('should throw error if pseudonym has less than minimum digits', () => {
    const functionUnderTest = () => generateRandomPseudonym('TEST', 3);
    expect(functionUnderTest).to.throw();
  });
});
