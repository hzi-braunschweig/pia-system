/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import { AccessToken } from '@pia/lib-service-core';
import { AnswersInteractor } from '../interactors/answersInteractor';
import { RESTPresenter, RESTResponse } from '../services/RESTPresenter';
import { Answer, PostAnswersRequest } from '../models/answer';

/**
 * @description HAPI Handler for answers
 */
export class AnswersHandler {
  /**
   * Creates or updates answers for a questionnaire instance
   */
  public static createOrUpdate: Lifecycle.Method = async (
    request
  ): Promise<RESTResponse & { answers: Answer[] }> => {
    const qInstanceId = request.params['id'] as number;
    const payload = request.payload as PostAnswersRequest;

    const answers = await AnswersInteractor.createOrUpdateAnswers(
      request.auth.credentials as AccessToken,
      qInstanceId,
      payload.answers,
      payload.version,
      payload.date_of_release
    );
    return RESTPresenter.presentAnswers(answers, qInstanceId);
  };

  /**
   * Gets the answers for a questionnaire instance
   */
  public static get: Lifecycle.Method = async (
    request
  ): Promise<RESTResponse & { answers: Answer[] }> => {
    const qInstanceId = request.params['id'] as number;

    const answers = await AnswersInteractor.getAnswers(
      request.auth.credentials as AccessToken,
      qInstanceId
    );
    return RESTPresenter.presentAnswers(answers, qInstanceId);
  };

  /**
   * Gets the historical answers for a questionnaire instance
   */
  public static getHistorical: Lifecycle.Method = async (
    request
  ): Promise<RESTResponse & { answers: Answer[] }> => {
    const qInstanceId = request.params['id'] as number;

    const answers = await AnswersInteractor.getAnswersHistorical(
      request.auth.credentials as AccessToken,
      qInstanceId
    );
    return RESTPresenter.presentAnswers(answers, qInstanceId);
  };

  /**
   * Deletes the answer for an answer option
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    await AnswersInteractor.deleteAnswer(
      request.auth.credentials as AccessToken,
      request.params['id'] as number,
      request.params['answerOptionId'] as number
    );
    return null;
  };
}
