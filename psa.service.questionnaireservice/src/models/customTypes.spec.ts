/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { isIsoDateString } from '../models/customTypes';

describe('custom types', () => {
  context('isIsoDateString', () => {
    it('should return true for valid ISO date strings', () => {
      expect(isIsoDateString('2024-01-01')).to.equal(true);
      expect(isIsoDateString('2024-06-21')).to.equal(true);
      expect(isIsoDateString('2022-12-31')).to.equal(true);
    });

    it('should return false for invalid ISO date strings', () => {
      expect(isIsoDateString('')).to.equal(false);
      expect(isIsoDateString(null)).to.equal(false);
      expect(isIsoDateString(1)).to.equal(false);
      expect(isIsoDateString([])).to.equal(false);
      expect(isIsoDateString('2024-13-01')).to.equal(false);
      expect(isIsoDateString('2024-01-32')).to.equal(false);
      expect(isIsoDateString('2024-01-01T00:00:00Z')).to.equal(false);
    });
  });
});
