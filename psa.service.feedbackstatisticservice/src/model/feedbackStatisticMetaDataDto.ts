/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticStatus } from '../entities/feedbackStatistic';
import { FeedbackStatisticConfigurationDto } from './feedbackStatisticConfiguration';
import {
  RelativeFrequencyTimeSeriesDto,
  RelativeFrequencyTimeSeriesDataDto,
} from './relativeFrequencyTimeSeriesDto';

export type FeedbackStatisticDto = RelativeFrequencyTimeSeriesDto; // may be extended in the future

export type FeedbackStatisticTypeDto =
  FeedbackStatisticConfigurationDto['type'];

export type FeedbackStatisticDataDto = RelativeFrequencyTimeSeriesDataDto[]; // may be extended in the future

export interface FeedbackStatisticMetaDataDto {
  configurationId: number;
  title: string; // based on configuration
  description: string; // based on configuration
  status: FeedbackStatisticStatus;
  updatedAt: string | null; // ISO-Date, null falls pending
  type: FeedbackStatisticTypeDto;
  data: FeedbackStatisticDataDto | null;
}
