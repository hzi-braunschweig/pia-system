/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DateFormat, ExportUtilities } from './exportUtilities';

import { expect } from 'chai';

describe('exportUtilities', () => {
  describe('formatDateStringWithoutTimeZone()', () => {
    [
      'Thu Sep 14 2023 00:00:00 GMT+0200 (Central European Summer Time)',
      'Thu Sep 14 2023 00:00:00 GMT+0000 (Central European Summer Time)',
      'Thu Sep 14 2023 00:00:00 GMT+1400 (Central European Summer Time)',
      'Thu Sep 14 2023 00:00:00 GMT-1200 (Central European Summer Time)',
    ].forEach((date) => {
      it(`should extract the date without respecting the time zone for date ${date}`, () => {
        expect(
          ExportUtilities.formatDateStringWithoutTimeZone(date, DateFormat.Date)
        ).to.equal('2023-09-14');
      });
    });

    it('should parse the date even tho it is in another format than expected', () => {
      const date = '2023-09-14';

      expect(
        ExportUtilities.formatDateStringWithoutTimeZone(date, DateFormat.Date)
      ).to.equal('2023-09-14');
    });

    it('should throw an error if the the date cannot be parsed', () => {
      const date = 'invalid-date';

      expect(() =>
        ExportUtilities.formatDateStringWithoutTimeZone(date, DateFormat.Date)
      ).to.throw('Could not parse the date');
    });
  });
});
