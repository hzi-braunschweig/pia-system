/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isForeignKeyError, isUniqueKeyError } from './errorHandlingUtils';
import { expect } from 'chai';

class DataBaseError extends Error {
  public readonly driverError = {
    code: '',
  };

  public constructor(code: string, message?: string) {
    super(message);
    this.driverError.code = code;
  }
}

describe('error handling utils', function () {
  describe('isForeignKeyError()', function () {
    it('should return true if a DataBaseError contains error code 23503', function () {
      const error = new DataBaseError('23503');
      expect(isForeignKeyError(error)).to.be.true;
    });

    it('should return false if a DataBaseError contains another error code', function () {
      const error = new DataBaseError('1234');
      expect(isForeignKeyError(error)).to.be.false;
    });

    it('should return false if a usual Error was given', function () {
      const error = new Error('not a DataBaseError');
      expect(isForeignKeyError(error)).to.be.false;
    });

    it('should return false if no Error was given', function () {
      expect(isForeignKeyError({})).to.be.false;
    });
  });

  describe('isUniqueKeyError()', function () {
    it('should return true if a DataBaseError contains error code 23505', function () {
      const error = new DataBaseError('23505');
      expect(isUniqueKeyError(error)).to.be.true;
    });

    it('should return false if a DataBaseError contains another error code', function () {
      const error = new DataBaseError('1234');
      expect(isUniqueKeyError(error)).to.be.false;
    });

    it('should return false if a usual Error was given', function () {
      const error = new Error('not a DataBaseError');
      expect(isUniqueKeyError(error)).to.be.false;
    });

    it('should return false if no Error was given', function () {
      expect(isUniqueKeyError({})).to.be.false;
    });
  });
});
