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

export const description = `
## Lorem ipsum dolor sit amet
### Lorem subtitle

Consetetur sadipscing elitr, sed diam nonumy
eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
voluptua. 

*At vero eos et accusam et justo duo* dolores et ea rebum. Stet
clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed
diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.

Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor
sit amet. 

1. Lorem ipsum dolor sit amet
2. Consetetur sadipscing elitr 
3. Sed diam nonumy eirmod tempor 

Invidunt ut labore et dolore magna aliquyam
erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea
rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate
velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis
at vero eros et accumsan et iusto odio dignissim qui blandit praesent
luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem
ipsum dolor sit amet.`;

export function createFakeFeedbackStatisticDto(
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
    description,
    updatedAt: '2021-01-01T00:00:00.000Z',
    data,
    ...overwrite,
  };
}
