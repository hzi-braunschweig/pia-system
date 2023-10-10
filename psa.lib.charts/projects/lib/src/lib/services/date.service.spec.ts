/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DateService } from './date.service';
import { TranslateService } from '@ngx-translate/core';

describe('DateService', () => {
  let service: DateService;
  let mockTranslateService: Partial<TranslateService>;

  beforeEach(() => {
    const prefix = 'CHARTS.FEEDBACK_STATISTIC.';

    mockTranslateService = {
      instant(key: string | string[]): any {
        return Array.isArray(key)
          ? key.map((k) => k.replace(prefix, ''))
          : key.replace(prefix, '');
      },
    };
    service = new DateService(mockTranslateService as TranslateService);
  });

  describe('getDuration', () => {
    it('should return a duration from an array interval', function () {
      const interval = [new Date('2023-01-01'), new Date('2023-01-02')];
      const duration = service.getDuration(interval);

      expect(duration).toEqual({
        years: 0,
        months: 0,
        days: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });
  });

  describe('isDurationRegular', () => {
    const regularCases: [string, Date, Date][] = [
      [
        'hour',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-01-01T01:00:00'),
      ],
      ['day', new Date('2023-01-01T00:00:00'), new Date('2023-01-02T00:00:00')],
      [
        'week',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-01-08T00:00:00'),
      ],
      [
        'month',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-02-01T00:00:00'),
      ],
      [
        'year',
        new Date('2023-01-01T00:00:00'),
        new Date('2024-01-01T00:00:00'),
      ],
    ];

    const irregularCases: [string, Date, Date][] = [
      [
        'hours',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-01-01T02:00:00'),
      ],
      [
        'days',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-01-03T00:00:00'),
      ],
      [
        'weeks',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-01-15T00:00:00'),
      ],
      [
        'months',
        new Date('2023-01-01T00:00:00'),
        new Date('2023-03-01T00:00:00'),
      ],
      [
        'years',
        new Date('2023-01-01T00:00:00'),
        new Date('2025-01-01T00:00:00'),
      ],
    ];

    describe('return true', () => {
      for (const [name, start, end] of regularCases) {
        it(`should return true if duration a exactly one ${name}`, () => {
          const duration = service.getDuration([start, end]);
          const isDurationRegular = service.isDurationRegular(duration);

          expect(isDurationRegular).toBeTrue();
        });
      }
    });

    describe('return false', () => {
      for (const [name, start, end] of irregularCases) {
        it(`should return false if duration spans multiple ${name}`, () => {
          const duration = service.getDuration([start, end]);
          const isDurationRegular = service.isDurationRegular(duration);

          expect(isDurationRegular).toBeFalse();
        });
      }
    });
  });

  describe('getLabelForInterval', () => {
    describe('regular cases', () => {
      const regularCases: [string, Date, Date, Date, string][] = [
        [
          'hour',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T01:00:00'),
          '01.01.2023 00:00 - 01:00',
        ],
        [
          'hour',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T05:00:00'),
          new Date('2023-01-01T06:00:00'),
          '01.01.2023 05:00 - 06:00',
        ],
        [
          '1st day',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-02T00:00:00'),
          'DAY 1',
        ],
        [
          '4th day',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-04T00:00:00'),
          new Date('2023-01-05T00:00:00'),
          'DAY 4',
        ],
        [
          '1st week',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-08T00:00:00'),
          'WEEK 1',
        ],
        [
          '2n week',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-14T00:00:00'),
          new Date('2023-01-21T00:00:00'),
          'WEEK 2',
        ],
        [
          '1st month',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-02-01T00:00:00'),
          'MONTH 1',
        ],
        [
          '8th month',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-08-01T00:00:00'),
          new Date('2023-09-01T00:00:00'),
          'MONTH 8',
        ],
        [
          '1st year',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2024-01-01T00:00:00'),
          'YEAR 1',
        ],
        [
          '10th year',
          new Date('2023-01-01T00:00:00'),
          new Date('2032-01-01T00:00:00'),
          new Date('2033-01-01T00:00:00'),
          'YEAR 10',
        ],
      ];

      for (const [name, beginning, start, end, expected] of regularCases) {
        it(`should return ${expected} for ${name} interval`, () => {
          const label = service.getLabelForInterval(beginning, [start, end]);
          expect(label).toEqual(expected);
        });
      }
    });

    describe('irregular cases', () => {
      const irregularCases: [string, Date, Date, Date, string][] = [
        [
          'every 2nd hour',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T02:00:00'),
          '01.01.2023 00:00 - 02:00',
        ],
        [
          'every 2nd hour starting from the 5th',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T05:00:00'),
          new Date('2023-01-01T07:00:00'),
          '01.01.2023 05:00 - 07:00',
        ],
        [
          'every 3rd day',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-04T00:00:00'),
          'DAYS 1-3',
        ],
        [
          'every 2rd day starting the 4th day',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-04T00:00:00'),
          new Date('2023-01-07T00:00:00'),
          'DAYS 4-6',
        ],
        [
          'every 2nd week',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-15T00:00:00'),
          'WEEKS 1-2',
        ],
        [
          'every 2nd week starting the 2nd week',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-14T00:00:00'),
          new Date('2023-01-28T00:00:00'),
          'WEEKS 2-3',
        ],
        [
          'every 2nd month',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2023-03-01T00:00:00'),
          'MONTHS 1-2',
        ],
        [
          'every 2nd month starting the 6th month',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-06-01T00:00:00'),
          new Date('2023-09-01T00:00:00'),
          'MONTHS 6-8',
        ],
        [
          'every 2nd year',
          new Date('2023-01-01T00:00:00'),
          new Date('2023-01-01T00:00:00'),
          new Date('2025-01-01T00:00:00'),
          'YEARS 1-2',
        ],
        [
          'every 2nd year starting in two years',
          new Date('2023-01-01T00:00:00'),
          new Date('2024-01-01T00:00:00'),
          new Date('2027-01-01T00:00:00'),
          'YEARS 2-4',
        ],
      ];

      for (const [name, beginning, start, end, expected] of irregularCases) {
        it(`should return ${expected} for ${name} interval`, () => {
          const label = service.getLabelForInterval(beginning, [start, end]);
          expect(label).toEqual(expected);
        });
      }
    });
  });
});
