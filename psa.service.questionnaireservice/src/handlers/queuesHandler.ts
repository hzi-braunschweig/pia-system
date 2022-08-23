/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import { AccessToken } from '@pia/lib-service-core';
import { QueuesInteractor } from '../interactors/queuesInteractor';
import { RESTPresenter, RESTResponse } from '../services/RESTPresenter';
import { QuestionnaireInstanceQueue } from '../models/questionnaireInstanceQueue';

export class QueuesHandler {
  /**
   * Gets the instances queues for a proband
   */
  public static getAll: Lifecycle.Method = async (
    request
  ): Promise<RESTResponse & { queues: QuestionnaireInstanceQueue[] }> => {
    const pseudonym = request.params['pseudonym'] as string;
    const result = await QueuesInteractor.getAllQueues(
      request.auth.credentials as AccessToken,
      pseudonym
    );
    return RESTPresenter.presentAllQueues(result, pseudonym);
  };

  /**
   * Deletes the queued instance
   */
  public static deleteOne: Lifecycle.Method = async (
    request
  ): Promise<null> => {
    await QueuesInteractor.deleteOneQueue(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.params['instanceId'] as string
    );
    return null;
  };
}
