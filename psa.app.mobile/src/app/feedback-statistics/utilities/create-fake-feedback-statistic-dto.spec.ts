/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ColorPaletteUtility,
  DataFakerUtility,
  FeedbackStatisticDto,
  RelativeFrequencyTimeSeriesDataDto,
} from '@pia-system/charts';
import { add } from 'date-fns';

export default function createFakeFeedbackStatisticDto(
  overwrite: Partial<FeedbackStatisticDto> = {},
  duration: Duration = { weeks: 10 },
  cycle: Duration = { weeks: 1 },
  categories: string[] = [
    'Sneeze',
    'Headache',
    'Running nose',
    'Walking nose',
    'Climbing nose',
    'Sleeping nose',
  ],
  startDate: Date = new Date('2023-01-01T00:00:00.000Z')
): FeedbackStatisticDto {
  const fakeData = DataFakerUtility.generateFeedbackStatistic(
    startDate,
    add(startDate, duration),
    cycle,
    categories
  );

  const data: RelativeFrequencyTimeSeriesDataDto[] = fakeData.series.map(
    (series, i) => ({
      color: ColorPaletteUtility.getColorForIterator(i),
      label: series.label,
      intervals: fakeData.intervals.map((interval, i) => ({
        value: series.data[i],
        timeRange: {
          startDate: interval[0].toISOString(),
          endDate: interval[1].toISOString(),
        },
      })),
    })
  );

  return {
    type: 'relative_frequency_time_series',
    configurationId: 1,
    status: 'has_data',
    title: 'title',
    description: 'description',
    updatedAt: '2021-01-01T00:00:00.000Z',
    data,
    ...overwrite,
  };
}
