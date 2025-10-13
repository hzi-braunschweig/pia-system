/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { RESTPresenter } from '../services/RESTPresenter';
import { QuestionnairesInteractor } from '../interactors/questionnairesInteractor';
import { Questionnaire, QuestionnaireRequest } from '../models/questionnaire';
import { AccessToken, CredentialsExtra } from '@pia/lib-service-core';
import {
  QuestionnaireImportRequestParams,
  QuestionnaireImportRequestPayload,
} from '../models/routes/questionnaireImport';

export class QuestionnairesHandler {
  /**
   * Creates a new questionnaire
   */
  public static readonly create: Lifecycle.Method = async (request) => {
    const questionnaire: Questionnaire =
      await QuestionnairesInteractor.createQuestionnaire(
        request.auth.credentials as AccessToken,
        request.payload as QuestionnaireRequest
      );
    return RESTPresenter.presentQuestionnaire(questionnaire);
  };

  /**
   * Updates the questionnaire with the specified id
   */
  public static readonly update: Lifecycle.Method = async (request) => {
    const questionnaire: Questionnaire =
      await QuestionnairesInteractor.updateQuestionnaire(
        request.auth.credentials as AccessToken,
        request.params['id'] as number,
        request.params['version'] as number,
        request.payload as QuestionnaireRequest
      );
    return RESTPresenter.presentQuestionnaire(questionnaire);
  };

  /**
   * Revises the questionnaire from the specified id
   */
  public static readonly revise: Lifecycle.Method = async (request) => {
    const questionnaire: Questionnaire =
      await QuestionnairesInteractor.reviseQuestionnaire(
        request.auth.credentials as AccessToken,
        request.params['id'] as number,
        request.payload as QuestionnaireRequest
      );
    return RESTPresenter.presentQuestionnaire(questionnaire);
  };

  public static readonly import: Lifecycle.Method<{
    AuthCredentialsExtra: CredentialsExtra;
    Payload: QuestionnaireImportRequestPayload;
    Params: QuestionnaireImportRequestParams;
  }> = async (request) => {
    return await QuestionnairesInteractor.importQuestionnaires(
      request.params.studyName,
      request.payload.publishMode,
      request.payload.questionnaireFiles
    );
  };

  /**
   * Gets the questionnaire
   */
  public static readonly getOne: Lifecycle.Method = async (request) => {
    const questionnaire: Questionnaire =
      await QuestionnairesInteractor.getQuestionnaire(
        request.auth.credentials as AccessToken,
        request.params['id'] as number,
        request.params['version'] as number
      );
    return RESTPresenter.presentQuestionnaire(questionnaire);
  };

  /**
   * Get all questionnaires the user has access to
   */
  public static readonly getAll: Lifecycle.Method = async (request) => {
    const questionnaires: Questionnaire[] =
      await QuestionnairesInteractor.getQuestionnaires(
        request.auth.credentials as AccessToken
      );
    return RESTPresenter.presentQuestionnaires(questionnaires);
  };

  /**
   * Deletes the questionnaire
   */
  public static readonly deleteOne: Lifecycle.Method = async (request) => {
    await QuestionnairesInteractor.deleteQuestionnaire(
      request.auth.credentials as AccessToken,
      request.params['id'] as number,
      request.params['version'] as number
    );
    return null;
  };

  /**
   * Deactivates the questionnaire
   */
  public static patch: Lifecycle.Method = async (request) => {
    const questionnaire: Questionnaire = await QuestionnairesInteractor.patch(
      request.auth.credentials as AccessToken,
      request.params['id'] as number,
      request.params['version'] as number,
      request.payload as Partial<QuestionnaireRequest>
    );
    return RESTPresenter.presentQuestionnaire(questionnaire);
  };
}
