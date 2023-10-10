/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TimeSpanDto } from './time-span';
import { TimeRangeDto } from './time-range';

export type FeedbackStatisticVisibility =
  | 'hidden'
  | 'testprobands'
  | 'allaudiences';

export type FeedbackStatisticConfigurationDto =
  RelativeFrequencyTimeSeriesConfigurationDto; // may be extended later

interface FeedbackStatisticConfigurationMetaDataDto {
  id: number;
  study: string;
  visibility: FeedbackStatisticVisibility;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelativeFrequencyTimeSeriesConfigurationDto
  extends FeedbackStatisticConfigurationMetaDataDto {
  type: 'relative_frequency_time_series';
  comparativeValues: {
    questionnaire: QuestionnaireReferenceDto;
    answerOptionValueCodes: AnswerOptionValueCodesReferenceDto;
  };
  timeSeries: FeedbackStatisticTimeSeriesDto[];
  intervalShift: TimeSpanDto;
  timeRange: TimeRangeDto;
}

export interface FeedbackStatisticTimeSeriesDto {
  color: string; // hex code
  label: string;
  questionnaire: QuestionnaireReferenceDto;
  answerOptionValueCodes: AnswerOptionValueCodesReferenceDto;
}

export interface QuestionnaireReferenceDto {
  id: number;
  version: number;
}

export interface AnswerOptionValueCodesReferenceDto {
  id: number;
  variableName: string | null;
  valueCodes: number[];
}
