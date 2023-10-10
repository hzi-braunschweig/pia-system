/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DataFakerUtility } from './data-faker.utility';

describe('DataFakerUtility', () => {
  const fakeRandomNumbers = [0.5, 0.25, 0.75, 0.1];
  const fakeRandomNumbersScaled = fakeRandomNumbers.map((n) => n * 100);

  beforeEach(() => {
    spyOn(Math, 'random').and.returnValues(...fakeRandomNumbers);
  });

  describe('generateRandomNumberArray', () => {
    it('should create an array of random numbers', () => {
      expect(DataFakerUtility.generateRandomNumberArray(4)).toEqual(
        fakeRandomNumbersScaled
      );
    });
  });

  describe('generateFeedbackStatistic', () => {
    it('should create a feedback statistic', () => {
      const startDate = new Date('2023-01-01T00:00:00.000Z');
      const endDate = new Date('2023-01-05T00:00:00.000Z');
      const duration = { days: 1 };
      const categories = ['Category'];
      const result = DataFakerUtility.generateFeedbackStatistic(
        startDate,
        endDate,
        duration,
        categories
      );

      expect(result).toEqual({
        intervals: [
          [
            new Date('2023-01-01T00:00:00.000Z'),
            new Date('2023-01-02T00:00:00.000Z'),
          ],
          [
            new Date('2023-01-02T00:00:00.000Z'),
            new Date('2023-01-03T00:00:00.000Z'),
          ],
          [
            new Date('2023-01-03T00:00:00.000Z'),
            new Date('2023-01-04T00:00:00.000Z'),
          ],
          [
            new Date('2023-01-04T00:00:00.000Z'),
            new Date('2023-01-05T00:00:00.000Z'),
          ],
        ],
        series: [
          {
            label: 'Category',
            color: '#668F31',
            data: fakeRandomNumbersScaled,
          },
        ],
      });
    });
  });
});
