/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { isArrayOfStrings } from './typeGuards';

describe('typeGuards', () => {
  describe('isArrayOfStrings()', () => {
    it('should return whether input is an array of strings', () => {
      const array = ['a', 'b', 'c'];
      expect(isArrayOfStrings('no array')).to.be.false;
      expect(isArrayOfStrings(array)).to.be.true;
    });
  });
});
