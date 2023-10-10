/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FeedbackStatisticMetaDataDto } from '../model/feedbackStatisticMetaDataDto';
import { FeedbackStatisticService } from '../services/FeedbackStatisticService';
import { userserviceClient } from '../clients/userserviceClient';
import { internal } from '@hapi/boom';
import { FeedbackStatisticStatus } from '../entities/feedbackStatistic';
import { FeedbackStatisticVisibility } from '../entities/feedbackStatisticConfiguration';

export class FeedbackStatisticInteractor {
  public static async getFeedbackStatisticsForAdmin(
    studyName: string
  ): Promise<FeedbackStatisticMetaDataDto[]> {
    return await FeedbackStatisticService.getFeedbackStatistics(studyName, [
      FeedbackStatisticVisibility.HIDDEN,
      FeedbackStatisticVisibility.TESTPROBANDS,
      FeedbackStatisticVisibility.ALLAUDIENCES,
    ]);
  }

  public static async getFeedbackStatisticsForProband(
    pseudonym: string,
    studyName: string
  ): Promise<FeedbackStatisticMetaDataDto[]> {
    const proband = await userserviceClient.getProband(pseudonym);

    if (!proband) {
      throw internal('proband not found');
    }

    return await FeedbackStatisticService.getFeedbackStatistics(
      studyName,
      proband.isTestProband
        ? [
            FeedbackStatisticVisibility.TESTPROBANDS,
            FeedbackStatisticVisibility.ALLAUDIENCES,
          ]
        : [FeedbackStatisticVisibility.ALLAUDIENCES],
      [FeedbackStatisticStatus.HAS_DATA]
    );
  }
}
