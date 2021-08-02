/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import * as Boom from '@hapi/boom';

import { config } from '../config';
import { QuestionnaireInstance } from '../models/questionnaireInstance';
import { Questionnaire } from '../models/questionnaire';

export class QuestionnaireserviceClient {
  private static readonly serviceUrl = config.services.questionnaireservice.url;

  /**
   * Gets all pseudonyms from pia that are in a specific study or have a specific status account
   */
  public static async getQuestionnaireInstance(
    id: number
  ): Promise<QuestionnaireInstance> {
    let res;
    try {
      res = await fetch.default(
        `${QuestionnaireserviceClient.serviceUrl}/questionnaire/questionnaireInstances/${id}`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'QuestionnaireserviceClient getQuestionnaireInstance: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'QuestionnaireserviceClient getQuestionnaireInstance: received an Error',
        await res.text(),
        res.status
      );
    }
    const body = (await res.json()) as QuestionnaireInstance;
    QuestionnaireserviceClient.convertQuestionnaireInstanceDates(body);
    return body;
  }

  private static convertQuestionnaireInstanceDates(
    qinstance: QuestionnaireInstance
  ): void {
    qinstance.date_of_issue = new Date(qinstance.date_of_issue);
    qinstance.date_of_release_v1 =
      qinstance.date_of_release_v1 && new Date(qinstance.date_of_release_v1);
    qinstance.date_of_release_v2 =
      qinstance.date_of_release_v2 && new Date(qinstance.date_of_release_v2);
    qinstance.transmission_ts_v1 =
      qinstance.transmission_ts_v1 && new Date(qinstance.transmission_ts_v1);
    qinstance.transmission_ts_v2 =
      qinstance.transmission_ts_v2 && new Date(qinstance.transmission_ts_v2);
    QuestionnaireserviceClient.convertQuestionnaireDates(
      qinstance.questionnaire
    );
  }

  private static convertQuestionnaireDates(questionnaire: Questionnaire): void {
    questionnaire.activate_at_date =
      questionnaire.activate_at_date &&
      new Date(questionnaire.activate_at_date);
    questionnaire.created_at =
      questionnaire.created_at && new Date(questionnaire.created_at);
  }
}
