/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { isoDateStringReviverFn } from './json';

describe('isoDateStringReviverFn', () => {
  it('should convert iso date strings to Date objects', () => {
    const value1 = '2015';
    const value2 = '2012-06-01';
    const value3 = '2018-06-30T12:30:00.000Z';

    const result1 = isoDateStringReviverFn('somekey', value1);
    const result2 = isoDateStringReviverFn('somekey', value2);
    const result3 = isoDateStringReviverFn('somekey', value3);

    expect(result1 instanceof Date).to.be.true;
    expect(result2 instanceof Date).to.be.true;
    expect(result3 instanceof Date).to.be.true;
    expect((result1 as Date).toISOString()).to.equal(
      '2015-01-01T00:00:00.000Z'
    );
    expect((result2 as Date).toISOString()).to.equal(
      '2012-06-01T00:00:00.000Z'
    );
    expect((result3 as Date).toISOString()).to.equal(
      '2018-06-30T12:30:00.000Z'
    );
  });

  it('should return strings which are not iso dates', () => {
    const value1 = '55555';
    const value2 = '30.06.2018';

    const result1 = isoDateStringReviverFn('somekey', value1);
    const result2 = isoDateStringReviverFn('somekey', value2);

    expect(result1 instanceof Date).to.be.false;
    expect(result2 instanceof Date).to.be.false;
    expect(result1).to.equal(value1);
    expect(result2).to.equal(value2);
  });

  it('should return other value types as they are', () => {
    const value1 = 1234;
    const value2 = true;
    const value3 = null;

    const result1 = isoDateStringReviverFn('somekey', value1);
    const result2 = isoDateStringReviverFn('somekey', value2);
    const result3 = isoDateStringReviverFn('somekey', value3);

    expect(result1 instanceof Date).to.be.false;
    expect(result2 instanceof Date).to.be.false;
    expect(result3 instanceof Date).to.be.false;
    expect(result1).to.equal(value1);
    expect(result2).to.equal(value2);
    expect(result3).to.equal(value3);
  });
});
