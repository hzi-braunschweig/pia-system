/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  FeedbackStatisticData,
  FeedbackStatisticStatus,
} from '../entities/feedbackStatistic';
import { FeedbackStatisticTypeDto } from '../model/feedbackStatisticMetaDataDto';
import { AbstractFeedbackStatisticGenerator } from './abstractFeedbackStatisticGenerator';
import { relativeFrequencyTimeSeriesGenerator } from './relativeFrequencyTimeSeriesGenerator';
import { FeedbackStatisticConfiguration } from '../entities/feedbackStatisticConfiguration';
import { asyncForEach, ExecutionTime } from '@pia/lib-service-core';
import { FeedbackStatisticService } from './FeedbackStatisticService';
import { getRepository } from 'typeorm';

export class InsufficientDataError extends Error {
  public constructor() {
    super('Insufficient data');
  }
}

export class FeedbackStatisticUpdater {
  private static readonly feedbackStatisticGenerators = new Map<
    FeedbackStatisticTypeDto,
    AbstractFeedbackStatisticGenerator<FeedbackStatisticData>
  >([['relative_frequency_time_series', relativeFrequencyTimeSeriesGenerator]]);

  public constructor(
    private readonly configuration: FeedbackStatisticConfiguration
  ) {}

  public static async updateFeedbackStatistic(
    configurationId: number
  ): Promise<void> {
    const config = await getRepository(
      FeedbackStatisticConfiguration
    ).findOneOrFail(configurationId);

    await FeedbackStatisticService.createEmptyFeedbackStatistic(
      config.id,
      config.study,
      config.type
    );

    await new FeedbackStatisticUpdater(config).updateFeedbackStatistic();
  }

  public static async updateFeedbackStatistics(): Promise<void> {
    // ensure every configuration has a feedback statistic
    await FeedbackStatisticService.createMissingFeedbackStatistics();

    await asyncForEach(
      await FeedbackStatisticService.getLeastRecentFeedbackStatistics(),
      async (feedbackStatistic) => {
        await new FeedbackStatisticUpdater(
          feedbackStatistic.configuration
        ).updateFeedbackStatistic();
      }
    );
  }

  public async updateFeedbackStatistic(): Promise<void> {
    const executionTime = new ExecutionTime();
    console.log(
      `Updating feedback statistic with ID ${this.configuration.id} and title "${this.configuration.title}"`
    );
    await FeedbackStatisticService.updateDataAndStatus(
      this.configuration.id,
      null,
      FeedbackStatisticStatus.PENDING
    );

    try {
      const updaterImpl =
        FeedbackStatisticUpdater.feedbackStatisticGenerators.get(
          this.configuration.type
        );

      if (!updaterImpl) {
        throw new Error(
          `No feedback statistic generator implementation found for type ${this.configuration.type} of feedback statistic with ID ${this.configuration.id}`
        );
      }

      await FeedbackStatisticService.updateDataAndStatus(
        this.configuration.id,
        await updaterImpl.generateData(this.configuration.id),
        FeedbackStatisticStatus.HAS_DATA
      );
      console.log(
        `Successfully updated feedback statistic with ID ${
          this.configuration.id
        } ${executionTime.toString()}`
      );
    } catch (error) {
      if (error instanceof InsufficientDataError) {
        await FeedbackStatisticService.updateDataAndStatus(
          this.configuration.id,
          null,
          FeedbackStatisticStatus.INSUFFICIENT_DATA
        );
        console.warn(
          `Feedback statistic with ID ${
            this.configuration.id
          } has insufficient data ${executionTime.toString()}`
        );
        return;
      }

      await FeedbackStatisticService.updateDataAndStatus(
        this.configuration.id,
        null,
        FeedbackStatisticStatus.ERROR
      );
      console.error(
        `Error while updating feedback statistic with ID ${
          this.configuration.id
        } ${executionTime.toString()}`,
        error
      );
    }
  }
}
