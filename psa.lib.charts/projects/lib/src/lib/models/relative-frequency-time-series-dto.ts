/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticMetaDataDto } from './feedback-statistic-dto';
import { TimeRangeDto } from './time-range';

export interface RelativeFrequencyTimeSeriesDto
  extends FeedbackStatisticMetaDataDto {
  type: 'relative_frequency_time_series';
  data: RelativeFrequencyTimeSeriesDataDto[] | null;
}

export interface RelativeFrequencyTimeSeriesDataDto {
  color: string;
  label: string;
  intervals: TimeSeriesIntervalDataDto[];
}

export interface TimeSeriesIntervalDataDto {
  timeRange: TimeRangeDto;
  value: number;
}
