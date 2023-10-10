/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { InternalQuestionnaireInteractor } from '../../interactors/internal/internalQuestionnaireInteractor';
import { QuestionnaireInstanceStatus } from '../../models/questionnaireInstance';
import { Readable } from 'stream';

export class InternalQuestionnaireHandler {
  public static getOne: Lifecycle.Method = async (request) => {
    return await InternalQuestionnaireInteractor.getQuestionnaire(
      request.params['id'] as number,
      request.params['version'] as number
    );
  };

  public static getAnswers: Lifecycle.Method = async (request) => {
    return new Readable().wrap(
      await InternalQuestionnaireInteractor.getAnswers(
        request.params['id'] as number,
        {
          status: request.query['status'] as QuestionnaireInstanceStatus[],
          minDateOfIssue: request.query['minDateOfIssue'] as Date,
          maxDateOfIssue: request.query['maxDateOfIssue'] as Date,
          answerOptionIds: request.query['answerOptionIds'] as number[],
          answerOptionVariableNames: request.query[
            'answerOptionVariableNames'
          ] as string[],
        }
      )
    );
  };
}
