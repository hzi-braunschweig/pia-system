/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticConfigurationDto } from './feedback-statistic-configuration';
import {
  RelativeFrequencyTimeSeriesDataDto,
  RelativeFrequencyTimeSeriesDto,
} from './relative-frequency-time-series-dto';

export type FeedbackStatisticStatus =
  | 'has_data'
  | 'pending'
  | 'insufficient_data'
  | 'error';

export type FeedbackStatisticDto = RelativeFrequencyTimeSeriesDto; // may be extended in the future

export type FeedbackStatisticTypeDto =
  FeedbackStatisticConfigurationDto['type'];

export type FeedbackStatisticDataDto = RelativeFrequencyTimeSeriesDataDto[]; // may be extended in the future

export interface FeedbackStatisticMetaDataDto {
  configurationId: number;
  title: string;
  description: string;
  status: FeedbackStatisticStatus;
  updatedAt: string | null;
  type: FeedbackStatisticTypeDto;
  data: FeedbackStatisticDataDto | null;
}
