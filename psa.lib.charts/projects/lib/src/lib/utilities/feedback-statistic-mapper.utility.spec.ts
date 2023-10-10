/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticMapperUtility } from './feedback-statistic-mapper.utility';
import {
  ChartFeedbackStatistic,
  FeedbackStatisticDto,
  RelativeFrequencyTimeSeriesDataDto,
} from '../models';

describe('FeedbackStatisticMapperUtility', () => {
  it('should map a feedback statistic dto to a chart feedback statistic', () => {
    // Arrange
    const feedbackStatisticDto: FeedbackStatisticDto = {
      title: 'Title',
      description: 'Description',
      updatedAt: '2023-01-31T00:00:00.000Z',
      status: 'has_data',
      configurationId: 1,
      type: 'relative_frequency_time_series',
      data: generateData([
        { label: 'Set 1', color: 'Color 1', data: [0, 49.51, 99.98] },
        { label: 'Set 2', color: 'Color 2', data: [1, 59.51, 100] },
      ]),
    };

    // Act
    const result = FeedbackStatisticMapperUtility.map(feedbackStatisticDto);

    // Assert
    const expected: ChartFeedbackStatistic = {
      intervals: [
        [
          new Date('2023-01-01T00:00:00.000Z'),
          new Date('2023-01-08T00:00:00.000Z'),
        ],
        [
          new Date('2023-01-08T00:00:00.000Z'),
          new Date('2023-01-15T00:00:00.000Z'),
        ],
        [
          new Date('2023-01-15T00:00:00.000Z'),
          new Date('2023-01-23T00:00:00.000Z'),
        ],
      ],
      series: [
        {
          label: 'Set 1',
          color: 'Color 1',
          data: [0, 49.51, 99.98],
        },

        {
          label: 'Set 2',
          color: 'Color 2',
          data: [1, 59.51, 100],
        },
      ],
    };
    expect(result).toEqual(expected);
  });

  it('should return null if dto data are empty', () => {
    // Arrange
    const feedbackStatisticDto: FeedbackStatisticDto = {
      title: 'Title',
      description: 'Description',
      updatedAt: '2023-01-31T00:00:00.000Z',
      status: 'has_data',
      configurationId: 1,
      type: 'relative_frequency_time_series',
      data: [],
    };

    // Act
    const result = FeedbackStatisticMapperUtility.map(feedbackStatisticDto);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null if dto data are null', () => {
    // Arrange
    const feedbackStatisticDto: FeedbackStatisticDto = {
      title: 'Title',
      description: 'Description',
      updatedAt: '2023-01-31T00:00:00.000Z',
      status: 'has_data',
      configurationId: 1,
      type: 'relative_frequency_time_series',
      data: null,
    };

    // Act
    const result = FeedbackStatisticMapperUtility.map(feedbackStatisticDto);

    // Assert
    expect(result).toBeNull();
  });

  function generateData(
    attributes: { label: string; color: string; data: number[] }[]
  ): RelativeFrequencyTimeSeriesDataDto[] {
    return attributes.map((attr) => ({
      label: attr.label,
      color: attr.color,
      intervals: [
        {
          value: attr.data[0],
          timeRange: {
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2023-01-08T00:00:00.000Z',
          },
        },
        {
          value: attr.data[1],
          timeRange: {
            startDate: '2023-01-08T00:00:00.000Z',
            endDate: '2023-01-15T00:00:00.000Z',
          },
        },
        {
          value: attr.data[2],
          timeRange: {
            startDate: '2023-01-15T00:00:00.000Z',
            endDate: '2023-01-23T00:00:00.000Z',
          },
        },
      ],
    }));
  }
});
