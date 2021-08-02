/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import Boom from '@hapi/boom';
import { QuestionnaireInstance } from '../models/questionnaireInstance';

export class InternalQuestionnaireInstancesInteractor {
  public static async getQuestionnaireInstance(
    id: number
  ): Promise<QuestionnaireInstance> {
    return await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
      id
    ).catch((err) => {
      throw Boom.notFound('Could not get the questionnaire instance', err);
    });
  }
}
