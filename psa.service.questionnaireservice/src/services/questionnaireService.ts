/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { runTransaction } from '../db';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { QuestionnaireRepository } from '../repositories/questionnaireRepository';
import { Questionnaire } from '../models/questionnaire';
import { getRepository } from 'typeorm';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';

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
        ['active', 'inactive', 'in_progress'],
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

  /**
   * Deletes all questionnaire instances of the proband which are inactive
   * and are to be filled out by probands. Those instances are not needed
   * anymore after a proband has been deactivated.
   */
  public static async deleteInactiveForProbandQuestionnaireInstances(
    pseudonym: string
  ): Promise<void> {
    const instanceIdsToDelete = (
      await getRepository(QuestionnaireInstance).find({
        relations: ['questionnaire'],
        where: {
          pseudonym,
          status: 'inactive',
          questionnaire: {
            type: 'for_probands',
          },
        },
      })
    ).map((instance) => instance.id);
    await getRepository(QuestionnaireInstance).delete(instanceIdsToDelete);
  }
}
