/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken } from '@pia/lib-service-core';
import { QuestionnaireInstanceQueue } from '../models/questionnaireInstanceQueue';
import pgHelper from '../services/postgresqlHelper';
import Boom from '@hapi/boom';

export class QueuesInteractor {
  /**
   * Gets all queues for a proband
   */
  public static async getAllQueues(
    decodedToken: AccessToken,
    username: string
  ): Promise<QuestionnaireInstanceQueue[]> {
    if (decodedToken.username !== username) {
      throw Boom.forbidden(
        'Could not get queues for proband, because user has no access'
      );
    }
    return (await pgHelper.getAllQueuesForProband(username).catch((err) => {
      console.log(err);
      throw new Error('Could not get queues for proband: internal DB error');
    })) as QuestionnaireInstanceQueue[];
  }

  public static async deleteOneQueue(
    decodedToken: AccessToken,
    pseudonym: string,
    instanceId: string
  ): Promise<void> {
    if (decodedToken.username !== pseudonym) {
      throw Boom.forbidden(
        'Could not delete queue for proband, because user has no access'
      );
    }
    await pgHelper.deleteQueue(pseudonym, instanceId).catch((err) => {
      console.log(err);
      throw Boom.notFound('Could not find queue for instanceId', instanceId);
    });
  }
}
