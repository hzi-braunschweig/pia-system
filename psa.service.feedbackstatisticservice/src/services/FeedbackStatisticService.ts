/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  FeedbackStatistic,
  FeedbackStatisticData,
  FeedbackStatisticStatus,
} from '../entities/feedbackStatistic';
import { getRepository, In, Not } from 'typeorm';
import { asyncForEach } from '@pia/lib-service-core';
import {
  FeedbackStatisticConfiguration,
  FeedbackStatisticVisibility,
} from '../entities/feedbackStatisticConfiguration';
import { FeedbackStatisticMetaDataDto } from '../model/feedbackStatisticMetaDataDto';
import { FeedbackStatisticType } from '../entities/specificFeedbackStatistics';

const availableFeedbackStatisticStatus = [
  FeedbackStatisticStatus.HAS_DATA,
  FeedbackStatisticStatus.PENDING,
  FeedbackStatisticStatus.INSUFFICIENT_DATA,
  FeedbackStatisticStatus.ERROR,
];

export class FeedbackStatisticService {
  public static async getFeedbackStatistics(
    study: string,
    visibilities: FeedbackStatisticVisibility[],
    status: FeedbackStatisticStatus[] = availableFeedbackStatisticStatus
  ): Promise<FeedbackStatisticMetaDataDto[]> {
    const statistics = await getRepository(FeedbackStatistic).find({
      where: {
        study,
        configuration: {
          visibility: In(visibilities),
        },
        status: In(status),
      },
      relations: ['configuration'],
    });

    return statistics.map((statistic) =>
      this.mapFeedbackStatisticToDto(statistic)
    );
  }

  public static async getLeastRecentFeedbackStatistics(): Promise<
    FeedbackStatistic[]
  > {
    return await getRepository(FeedbackStatistic).find({
      relations: ['configuration'],
      order: { updatedAt: 'ASC' },
      take: 10,
    });
  }

  public static async createMissingFeedbackStatistics(): Promise<void> {
    const allFeedbackStatisticIds = (
      await getRepository(FeedbackStatistic).find({
        select: ['configurationId'],
      })
    ).map((feedbackStatistic) => feedbackStatistic.configurationId);

    await asyncForEach(
      await getRepository(FeedbackStatisticConfiguration).find({
        select: ['id', 'study'],
        where: { id: Not(In(allFeedbackStatisticIds)) },
      }),
      async (config) =>
        await this.createEmptyFeedbackStatistic(
          config.id,
          config.study,
          config.type
        )
    );
  }

  public static async updateDataAndStatus(
    configurationId: number,
    data: FeedbackStatisticData | null,
    status: FeedbackStatisticStatus
  ): Promise<void> {
    await getRepository(FeedbackStatistic).update(configurationId, {
      status,
      data,
      updatedAt: new Date(),
    });
  }

  public static async createEmptyFeedbackStatistic(
    configurationId: number,
    study: string,
    type: FeedbackStatisticType
  ): Promise<void> {
    await getRepository(FeedbackStatistic).save({
      configurationId,
      study,
      type,
      status: FeedbackStatisticStatus.PENDING,
      updatedAt: null,
    });
  }

  private static mapFeedbackStatisticToDto(
    statistic: FeedbackStatistic
  ): FeedbackStatisticMetaDataDto {
    return {
      configurationId: statistic.configurationId,
      data: statistic.data,
      description: statistic.configuration.description,
      status: statistic.status,
      title: statistic.configuration.title,
      type: statistic.configuration.type,
      updatedAt: statistic.updatedAt?.toISOString() ?? null,
    };
  }
}
