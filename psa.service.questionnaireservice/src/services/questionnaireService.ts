/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { runTransaction } from '../db';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { QuestionnaireRepository } from '../repositories/questionnaireRepository';
import { Questionnaire } from '../models/questionnaire';

export class QuestionnaireService {
  /**
   * Deactivates a questionnaire and deletes all instances which have not yet been answered.
   */
  public static async deactivateQuestionnaire(
    id: number,
    version: number
  ): Promise<Questionnaire> {
    return await runTransaction(async (transaction): Promise<Questionnaire> => {
      await QuestionnaireInstanceRepository.deleteQuestionnaireInstancesByQuestionnaireId(
        id,
        version,
        ['active', 'inactive'],
        { transaction }
      );
      await QuestionnaireRepository.deactivateQuestionnaire(id, version, {
        transaction,
      });
      return await QuestionnaireRepository.getQuestionnaire(id, version, {
        transaction,
      });
    });
  }
}
