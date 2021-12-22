/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { Lifecycle, Request } from '@hapi/hapi';

import { AccessToken } from '@pia/lib-service-core';
import { RESTPresenter } from '../services/RESTPresenter';
import { QuestionnaireInstancesInteractor } from '../interactors/questionnaireInstancesInteractor';
import { QuestionnaireInstanceStatus } from '../models/questionnaireInstance';

/**
 * hapi handler for questionnaire instances
 */
export class QuestionnaireInstancesHandler {
  /**
   * Gets the questionnaire instance if the user has access
   */
  public static getOne: Lifecycle.Method = async (request: Request) => {
    try {
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstance(
          request.auth.credentials as AccessToken,
          request.params['id'] as number
        );
      return RESTPresenter.presentQuestionnaireInstance(result);
    } catch (err: unknown) {
      console.warn('Could not get questionnaire instance from DB: ', err);
      return Boom.notFound();
    }
  };

  /**
   * Gets all questionnaire instances for the requesting user filtered by the status
   */
  public static getAll: Lifecycle.Method = async (request: Request) => {
    try {
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstances(
          request.auth.credentials as AccessToken,
          request.query['status'] as QuestionnaireInstanceStatus[]
        );
      return RESTPresenter.presentQuestionnaireInstances(result);
    } catch (err) {
      console.log('Could not get questionnaire instances from DB: ', err);
      return Boom.notFound();
    }
  };

  /**
   * Gets the questionnaire instances for specified user if the requester has access
   */
  public static getAllForUser: Lifecycle.Method = async (request: Request) => {
    try {
      const result =
        await QuestionnaireInstancesInteractor.getQuestionnaireInstancesForUser(
          request.auth.credentials as AccessToken,
          request.params['user_id'] as string
        );
      return RESTPresenter.presentQuestionnaireInstances(result);
    } catch (err) {
      console.log('Could not get questionnaire instances from DB: ', err);
      return Boom.notFound();
    }
  };

  /**
   * Updates the questionnaire instance if the user has access
   */
  public static update: Lifecycle.Method = async (request: Request) => {
    const { status, progress, release_version } = request.payload as {
      status: QuestionnaireInstanceStatus | null;
      progress: number;
      release_version: number;
    };

    try {
      const result =
        await QuestionnaireInstancesInteractor.updateQuestionnaireInstance(
          request.auth.credentials as AccessToken,
          request.params['id'] as number,
          status,
          progress,
          release_version
        );
      return RESTPresenter.presentQuestionnaireInstance(result);
    } catch (err) {
      console.log('Could not update questionnaire instance in DB: ', err);
      return Boom.notFound();
    }
  };
}
