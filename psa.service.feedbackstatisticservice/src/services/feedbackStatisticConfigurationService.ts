/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticConfiguration } from '../entities/feedbackStatisticConfiguration';
import { RelativeFrequencyTimeSeriesConfiguration } from '../entities/relativeFrequencyTimeSeriesConfiguration';
import { FeedbackStatisticConfigurationDto } from '../model/feedbackStatisticConfiguration';
import { DbHelper } from '../helper/dbHelper';
import { FeedbackStatistic } from '../entities/feedbackStatistic';
import { messageQueueService } from './messageQueueService';
import { FeedbackStatisticConfigurationMapper } from './feedbackStatisticConfigurationMapper';
import { MarkOptional } from 'ts-essentials';
import { FeedbackStatisticTimeSeries } from '../entities/feedbackStatisticTimeSeries';
import { getRepository } from 'typeorm';
import { asyncForEach } from '@pia/lib-service-core';

export class FeedbackStatisticConfigurationService {
  public static async getFeedbackStatisticConfiguration(
    study: string,
    id: number
  ): Promise<FeedbackStatisticConfigurationDto> {
    return await DbHelper.runTransaction(async (queryRunner) => {
      const configuration = await queryRunner.manager.findOneOrFail(
        FeedbackStatisticConfiguration,
        {
          where: { id, study },
        }
      );

      const relativeFrequencyTimeSeries =
        await queryRunner.manager.findOneOrFail(
          RelativeFrequencyTimeSeriesConfiguration,
          {
            where: { id },
            relations: ['timeSeries'],
          }
        );

      return FeedbackStatisticConfigurationMapper.feedbackStatisticConfigurationEntityToDto(
        {
          ...configuration,
          ...relativeFrequencyTimeSeries,
        }
      );
    });
  }

  public static async upsertFeedbackStatisticConfiguration(
    configuration: MarkOptional<FeedbackStatisticConfigurationDto, 'id'>
  ): Promise<FeedbackStatisticConfigurationDto> {
    const id = await DbHelper.runTransaction(async (queryRunner) => {
      const savedConfig = await queryRunner.manager
        .getRepository(FeedbackStatisticConfiguration)
        .save(
          FeedbackStatisticConfigurationMapper.feedbackStatisticConfigurationDtoToEntity(
            configuration
          )
        );

      await queryRunner.manager
        .getRepository(RelativeFrequencyTimeSeriesConfiguration)
        .save(
          FeedbackStatisticConfigurationMapper.relativeFrequencyTimeSeriesConfigurationDtoToEntity(
            savedConfig.id,
            configuration
          )
        );

      await messageQueueService.sendConfigurationUpdated(savedConfig.id);

      return savedConfig.id;
    });
    return this.getFeedbackStatisticConfiguration(configuration.study, id);
  }

  public static async deleteFeedbackStatisticConfiguration(
    study: string,
    configurationId: number
  ): Promise<void> {
    return await DbHelper.runTransaction(async (queryRunner) => {
      await queryRunner.manager.delete(FeedbackStatistic, {
        configurationId,
        study,
      });

      await queryRunner.manager.delete(FeedbackStatisticTimeSeries, {
        relativeFrequencyTimeSeriesConfigurationId: configurationId,
      });

      await queryRunner.manager.delete(
        RelativeFrequencyTimeSeriesConfiguration,
        {
          id: configurationId,
        }
      );

      await queryRunner.manager.delete(FeedbackStatisticConfiguration, {
        id: configurationId,
        study,
      });
    });
  }

  public static async deleteFeedbackStatisticConfigurations(
    study: string
  ): Promise<void> {
    const configurations = await getRepository(
      FeedbackStatisticConfiguration
    ).find({
      where: { study },
    });
    await asyncForEach(
      configurations,
      async (configuration) =>
        await this.deleteFeedbackStatisticConfiguration(study, configuration.id)
    );
  }
}
