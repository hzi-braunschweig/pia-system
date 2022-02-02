/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { InternalQuestionnaireInstancesInteractor } from '../../interactors/internal/internalQuestionnaireInstancesInteractor';
import { QuestionnaireInstanceStatus } from '../../models/questionnaireInstance';

export class InternalQuestionnaireInstancesHandler {
  public static getOne: Lifecycle.Method = async (request) => {
    return await InternalQuestionnaireInstancesInteractor.getQuestionnaireInstance(
      request.params['id'] as number,
      request.query['filterQuestionnaireByConditions'] as boolean | undefined
    );
  };

  public static getAllForProband: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['pseudonym'] as string;
    const loadQuestionnaire = request.query['loadQuestionnaire'] as boolean;
    const status = request.query['status'] as QuestionnaireInstanceStatus[];
    return await InternalQuestionnaireInstancesInteractor.getQuestionnaireInstancesForProband(
      pseudonym,
      { status, loadQuestionnaire }
    );
  };

  public static getQuestionnaireInstanceAnswers: Lifecycle.Method = async (
    request
  ) => {
    const id = request.params['id'] as number;
    return await InternalQuestionnaireInstancesInteractor.getQuestionnaireInstanceAnswers(
      id
    );
  };
}
