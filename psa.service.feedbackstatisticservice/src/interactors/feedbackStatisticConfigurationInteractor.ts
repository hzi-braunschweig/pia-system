/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { notFound } from '@hapi/boom';
import { FeedbackStatisticConfigurationDto } from '../model/feedbackStatisticConfiguration';
import { FeedbackStatisticConfigurationService } from '../services/feedbackStatisticConfigurationService';

export class FeedbackStatisticConfigurationInteractor {
  public static async getFeedbackStatisticConfiguration(
    studyName: string,
    id: number
  ): Promise<FeedbackStatisticConfigurationDto> {
    try {
      return await FeedbackStatisticConfigurationService.getFeedbackStatisticConfiguration(
        studyName,
        id
      );
    } catch (error) {
      throw notFound(
        `Configuration with id ${id} for study ${studyName} not found`
      );
    }
  }

  public static async createFeedbackStatisticConfiguration(
    configuration: Omit<FeedbackStatisticConfigurationDto, 'id'>
  ): Promise<FeedbackStatisticConfigurationDto> {
    return await FeedbackStatisticConfigurationService.upsertFeedbackStatisticConfiguration(
      configuration
    );
  }

  public static async updateFeedbackStatisticConfiguration(
    configuration: FeedbackStatisticConfigurationDto
  ): Promise<FeedbackStatisticConfigurationDto> {
    await this.assertConfigurationExistsForStudy(
      configuration.study,
      configuration.id
    );

    return await FeedbackStatisticConfigurationService.upsertFeedbackStatisticConfiguration(
      configuration
    );
  }

  public static async deleteFeedbackStatisticConfiguration(
    studyName: string,
    configurationId: number
  ): Promise<void> {
    await this.assertConfigurationExistsForStudy(studyName, configurationId);

    return await FeedbackStatisticConfigurationService.deleteFeedbackStatisticConfiguration(
      studyName,
      configurationId
    );
  }

  private static async assertConfigurationExistsForStudy(
    studyName: string,
    id: number
  ): Promise<void> {
    try {
      await FeedbackStatisticConfigurationService.getFeedbackStatisticConfiguration(
        studyName,
        id
      );
    } catch (error) {
      throw notFound(
        `Configuration with id ${id} for study ${studyName} not found`
      );
    }
  }
}
