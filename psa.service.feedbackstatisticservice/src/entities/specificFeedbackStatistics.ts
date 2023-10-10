/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RelativeFrequencyTimeSeriesDataDto } from '../model/relativeFrequencyTimeSeriesDto';

export enum FeedbackStatisticType {
  RELATIVE_FREQUENCY_TIME_SERIES = 'relative_frequency_time_series',
}

export interface RelativeFrequencyTimeSeriesFeedbackStatistic {
  configuration: { type: FeedbackStatisticType.RELATIVE_FREQUENCY_TIME_SERIES };
  data: RelativeFrequencyTimeSeriesDataDto[] | null;
}

export type SpecificFeedbackStatistic =
  RelativeFrequencyTimeSeriesFeedbackStatistic; // may be extended in the future
