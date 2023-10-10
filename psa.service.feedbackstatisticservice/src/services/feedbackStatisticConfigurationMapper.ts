/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  FeedbackStatisticConfigurationDto,
  FeedbackStatisticTimeSeriesDto,
  RelativeFrequencyTimeSeriesConfigurationDto,
} from '../model/feedbackStatisticConfiguration';
import { FeedbackStatisticTimeSeries } from '../entities/feedbackStatisticTimeSeries';
import { FeedbackStatisticConfiguration } from '../entities/feedbackStatisticConfiguration';
import { FeedbackStatisticType } from '../entities/specificFeedbackStatistics';
import { RelativeFrequencyTimeSeriesConfiguration } from '../entities/relativeFrequencyTimeSeriesConfiguration';
import { MarkOptional } from 'ts-essentials';

export class FeedbackStatisticConfigurationMapper {
  public static feedbackStatisticConfigurationEntityToDto(
    entity: FeedbackStatisticConfiguration &
      RelativeFrequencyTimeSeriesConfiguration
  ): FeedbackStatisticConfigurationDto {
    return {
      id: entity.id,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      study: entity.study,
      description: entity.description,
      visibility: entity.visibility,
      title: entity.title,
      type: entity.type,
      comparativeValues: {
        answerOptionValueCodes: {
          id: entity.comparativeValues.answerOptionValueCodes.id,
          valueCodes:
            entity.comparativeValues.answerOptionValueCodes.valueCodes,
          variableName:
            entity.comparativeValues.answerOptionValueCodes.variableName,
        },
        questionnaire: {
          id: entity.comparativeValues.questionnaire.id,
          version: entity.comparativeValues.questionnaire.version,
        },
      },
      intervalShift: {
        amount: entity.intervalShift.amount,
        unit: entity.intervalShift.unit,
      },
      timeRange: {
        endDate: entity.timeRange.endDate?.toISOString() ?? null,
        startDate: entity.timeRange.startDate.toISOString(),
      },
      timeSeries: entity.timeSeries.map((ts) =>
        this.feedbackStatisticTimeSeriesEntityToDto(ts)
      ),
    };
  }

  public static feedbackStatisticConfigurationDtoToEntity(
    dto: MarkOptional<FeedbackStatisticConfigurationDto, 'id'>
  ): Partial<FeedbackStatisticConfiguration> {
    return {
      id: dto.id,
      description: dto.description,
      study: dto.study,
      title: dto.title,
      visibility: dto.visibility,
      type: dto.type as FeedbackStatisticType,
    };
  }

  public static relativeFrequencyTimeSeriesConfigurationDtoToEntity(
    id: number,
    dto: Omit<RelativeFrequencyTimeSeriesConfigurationDto, 'id'>
  ): RelativeFrequencyTimeSeriesConfiguration {
    return {
      id,
      study: dto.study,
      comparativeValues: {
        questionnaire: {
          id: dto.comparativeValues.questionnaire.id,
          version: dto.comparativeValues.questionnaire.version,
        },
        answerOptionValueCodes: {
          id: dto.comparativeValues.answerOptionValueCodes.id,
          valueCodes: dto.comparativeValues.answerOptionValueCodes.valueCodes,
          variableName:
            dto.comparativeValues.answerOptionValueCodes.variableName ?? null,
        },
      },
      timeSeries: dto.timeSeries.map((ts) =>
        this.feedbackStatisticTimeSeriesDtoToEntity(ts, dto.study, id)
      ),
      intervalShift: dto.intervalShift,
      timeRange: {
        startDate: new Date(dto.timeRange.startDate),
        endDate: dto.timeRange.endDate ? new Date(dto.timeRange.endDate) : null,
      },
    };
  }

  private static feedbackStatisticTimeSeriesEntityToDto(
    entity: FeedbackStatisticTimeSeries
  ): FeedbackStatisticTimeSeriesDto {
    return {
      id: entity.id,
      color: entity.color,
      label: entity.label,
      questionnaire: {
        id: entity.questionnaire.id,
        version: entity.questionnaire.version,
      },
      answerOptionValueCodes: {
        id: entity.answerOptionValueCodes.id,
        valueCodes: entity.answerOptionValueCodes.valueCodes,
        variableName: entity.answerOptionValueCodes.variableName,
      },
    };
  }

  private static feedbackStatisticTimeSeriesDtoToEntity(
    this: void,
    dto: FeedbackStatisticTimeSeriesDto,
    study: string,
    configurationId: number
  ): FeedbackStatisticTimeSeries {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      study,
      id: dto.id,
      color: dto.color,
      label: dto.label,
      questionnaire: dto.questionnaire,
      answerOptionValueCodes: {
        variableName: dto.answerOptionValueCodes.variableName,
        id: dto.answerOptionValueCodes.id,
        valueCodes: dto.answerOptionValueCodes.valueCodes,
      },
      relativeFrequencyTimeSeriesConfigurationId: configurationId,
    } as FeedbackStatisticTimeSeries;
  }
}
