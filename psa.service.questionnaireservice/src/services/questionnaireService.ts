/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getRepository } from 'typeorm';
import { runTransaction } from '../db';
import { Questionnaire } from '../entities/questionnaire';
import { CouldNotUpdateGeneratedCustomName } from '../errors';
import generateCustomName from '../helpers/generateCustomName';
import { Questionnaire as DeprecatedQuestionnaire } from '../models/questionnaire';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { QuestionnaireRepository } from '../repositories/questionnaireRepository';

export class QuestionnaireService {
  /**
   * Deactivates a questionnaire and deletes all instances which have not yet been answered.
   */
  public static async deactivateQuestionnaire(
    id: number,
    version: number
  ): Promise<DeprecatedQuestionnaire> {
    return await runTransaction(
      async (transaction): Promise<DeprecatedQuestionnaire> => {
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
      }
    );
  }

  /**
   * Generates and updates a custom name for the given questionnaire.
   * @return The generated custom name
   */
  public static async generateAndUpdateCustomName(
    questionnaire: Pick<Questionnaire, 'id' | 'version' | 'name'>
  ): Promise<string> {
    const customName = generateCustomName(questionnaire.name, questionnaire.id);
    const result = await getRepository(Questionnaire).update(
      {
        id: questionnaire.id,
        version: questionnaire.version,
      },
      {
        customName,
      }
    );

    if (result.affected === 0) {
      throw new CouldNotUpdateGeneratedCustomName(
        `Failed to update custom name "${customName}" for questionnaire with ID "${questionnaire.id}"`
      );
    }

    return customName;
  }
}
