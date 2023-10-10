/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { badRequest } from '@hapi/boom';
import { Lifecycle } from '@hapi/hapi';
import { FeedbackStatisticConfigurationDto } from '../model/feedbackStatisticConfiguration';

import { FeedbackStatisticConfigurationInteractor } from '../interactors/feedbackStatisticConfigurationInteractor';

export class FeedbackStatisticConfigurationHandler {
  public static getFeedbackStatisticConfiguration: Lifecycle.Method = async (
    request
  ): Promise<FeedbackStatisticConfigurationDto> => {
    return await FeedbackStatisticConfigurationInteractor.getFeedbackStatisticConfiguration(
      request.params['studyName'] as string,
      request.params['configurationId'] as number
    );
  };

  public static postFeedbackStatisticConfiguration: Lifecycle.Method = async (
    request
  ): Promise<Omit<FeedbackStatisticConfigurationDto, 'id'>> => {
    const configuration = request.payload as FeedbackStatisticConfigurationDto;

    if (request.params['studyName'] !== configuration.study) {
      throw badRequest('studies do not match');
    }

    return await FeedbackStatisticConfigurationInteractor.createFeedbackStatisticConfiguration(
      configuration
    );
  };

  public static putFeedbackStatisticConfiguration: Lifecycle.Method = async (
    request
  ): Promise<FeedbackStatisticConfigurationDto> => {
    const configuration = request.payload as FeedbackStatisticConfigurationDto;

    if (request.params['studyName'] !== configuration.study) {
      throw badRequest('studies do not match');
    }

    return await FeedbackStatisticConfigurationInteractor.updateFeedbackStatisticConfiguration(
      {
        ...configuration,
        id: request.params['configurationId'] as number,
      }
    );
  };

  public static deleteFeedbackStatisticConfiguration: Lifecycle.Method = async (
    request
  ): Promise<null> => {
    await FeedbackStatisticConfigurationInteractor.deleteFeedbackStatisticConfiguration(
      request.params['studyName'] as string,
      request.params['configurationId'] as number
    );
    return null;
  };
}
