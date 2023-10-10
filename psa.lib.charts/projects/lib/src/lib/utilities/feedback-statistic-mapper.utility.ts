/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChartFeedbackSeries,
  ChartFeedbackStatistic,
  FeedbackStatisticDto,
} from '../models';

export class FeedbackStatisticMapperUtility {
  public static map(dto: FeedbackStatisticDto): ChartFeedbackStatistic | null {
    if (!dto || !dto.data || dto.data.length === 0) {
      return null;
    }

    const intervals = dto.data[0].intervals.map((interval) => [
      new Date(interval.timeRange.startDate ?? 0),
      new Date(interval.timeRange.endDate ?? 0),
    ]);

    const series: ChartFeedbackSeries[] = dto.data.map((data) => {
      return {
        label: data.label,
        color: data.color,
        data: data.intervals.map((interval) => interval.value),
      };
    });

    return {
      intervals,
      series,
    };
  }
}
