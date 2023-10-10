/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { FeedbackStatisticMetaDataDto } from '../model/feedbackStatisticMetaDataDto';

import { FeedbackStatisticInteractor } from '../interactors/feedbackStatisticInteractor';
import { AccessToken } from '@pia/lib-service-core';
import { assert } from 'ts-essentials';

export class FeedbackStatisticHandler {
  public static getFeedbackStatisticsForAdmin: Lifecycle.Method = async (
    request
  ): Promise<FeedbackStatisticMetaDataDto[]> => {
    return await FeedbackStatisticInteractor.getFeedbackStatisticsForAdmin(
      request.params['studyName'] as string
    );
  };

  public static getFeedbackStatisticsForProband: Lifecycle.Method = async (
    request
  ): Promise<FeedbackStatisticMetaDataDto[]> => {
    const token = request.auth.credentials as AccessToken;

    assert(token.studies[0]);

    return await FeedbackStatisticInteractor.getFeedbackStatisticsForProband(
      token.username,
      token.studies[0]
    );
  };
}
