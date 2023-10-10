/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface TimeRangeDto {
  startDate: string; // ISO date string
  endDate: string | null; // ISO date string, null = now
}

export type TimeSpanUnit = 'hour' | 'day' | 'week' | 'month';

export interface TimeSpanDto {
  amount: number;
  unit: TimeSpanUnit;
}

export type FeedbackStatisticVisibility =
  | 'hidden'
  | 'testprobands'
  | 'allaudiences';

export type SpecificFeedbackStatisticConfigurationDto =
  RelativeFrequencyTimeSeriesConfigurationDto; // may be extended later

export type FeedbackStatisticConfigurationDto =
  FeedbackStatisticConfigurationMetaDataDto &
    SpecificFeedbackStatisticConfigurationDto; // may be extended later

export type FeedbackStatisticType = 'relative_frequency_time_series'; // may be extended later

export interface FeedbackStatisticConfigurationMetaDataDto {
  id?: number;
  study: string;
  visibility: FeedbackStatisticVisibility;
  title: string;
  description: string; // Markdown text
  createdAt?: string; // ISO-Date
  updatedAt?: string;
  type: FeedbackStatisticType;
}

export interface RelativeFrequencyTimeSeriesConfigurationDto {
  comparativeValues: {
    questionnaire: QuestionnaireReferenceDto;
    answerOptionValueCodes: AnswerOptionValueCodesReferenceDto;
  };
  timeSeries: FeedbackStatisticTimeSeriesDto[];
  intervalShift: TimeSpanDto;
  timeRange: TimeRangeDto;
}

export interface FeedbackStatisticTimeSeriesDto {
  id?: number;
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
