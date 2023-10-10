/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticMetaDataDto } from './feedbackStatisticMetaDataDto';
import { TimeRange } from './timeRange';

export interface RelativeFrequencyTimeSeriesDto
  extends FeedbackStatisticMetaDataDto {
  type: 'relative_frequency_time_series';
  data: RelativeFrequencyTimeSeriesDataDto[];
}

export interface RelativeFrequencyTimeSeriesDataDto {
  color: string;
  label: string;
  intervals: TimeSeriesIntervalDataDto[];
}

export interface TimeSeriesIntervalDataDto {
  timeRange: TimeRange;
  value: number;
}
