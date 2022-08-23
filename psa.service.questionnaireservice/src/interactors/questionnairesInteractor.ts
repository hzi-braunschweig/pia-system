/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken, assertStudyAccess } from '@pia/lib-service-core';
import { Questionnaire, QuestionnaireRequest } from '../models/questionnaire';
import pgHelper from '../services/postgresqlHelper';
import { StudyAccess } from '../models/studyAccess';
import Boom from '@hapi/boom';
import { QuestionnaireRepository } from '../repositories/questionnaireRepository';
import { DatabaseError } from 'pg-protocol';
import { QuestionnaireService } from '../services/questionnaireService';

export class QuestionnairesInteractor {
  /**
   * Deletes questionnaire from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the questionnaire to delete
   * @param version the version of the questionnaire to delete
   * @returns null if successful
   */
  public static async deleteQuestionnaire(
    decodedToken: AccessToken,
    id: number,
    version: number
  ): Promise<void> {
    await this.checkIfUserHasWriteAccessOnRequestedQuestionnaire(
      decodedToken,
      id,
      version
    );
    await pgHelper.deleteQuestionnaire(id, version).catch((err) => {
      console.log(err);
      throw Boom.badImplementation('Could not delete questionnaire');
    });
  }

  /**
   * Creates questionnaire from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param questionnaire the questionnaire to create
   * @returns questionnaire
   */
  public static async createQuestionnaire(
    decodedToken: AccessToken,
    questionnaire: QuestionnaireRequest
  ): Promise<Questionnaire> {
    await this.checkIfUserHasWriteAccessForStudy(
      decodedToken,
      questionnaire.study_id
    );
    return (await pgHelper.insertQuestionnaire(questionnaire).catch((err) => {
      console.log(err);
      throw Boom.badImplementation('Could not create questionnaire');
    })) as Questionnaire;
  }

  /**
   * Updates a questionnaire from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the questionnaire to update
   * @param version the version of the questionnaire to update
   * @param updatedQuestionnaire the updated questionnaire
   * @returns questionnaire
   */
  public static async updateQuestionnaire(
    decodedToken: AccessToken,
    id: number,
    version: number,
    updatedQuestionnaire: QuestionnaireRequest
  ): Promise<Questionnaire> {
    await this.checkIfUserHasWriteAccessOnRequestedQuestionnaire(
      decodedToken,
      id,
      version
    );
    await this.checkIfUserHasWriteAccessForStudy(
      decodedToken,
      updatedQuestionnaire.study_id
    );
    return (await pgHelper
      .updateQuestionnaire(updatedQuestionnaire, id, version)
      .catch((err) => {
        console.log(err);
        if (err instanceof DatabaseError && err.code === '23503') {
          throw Boom.preconditionFailed('A reference could not be set');
        }
        throw Boom.badImplementation('Could not update questionnaire');
      })) as Questionnaire;
  }

  /**
   * Changes specific attributes of a questionnaire if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the questionnaire to patch
   * @param version the version of the questionnaire to patch
   * @param changedAttributes the updated questionnaire attributes
   * @returns questionnaire
   */
  public static async patch(
    decodedToken: AccessToken,
    id: number,
    version: number,
    changedAttributes: Partial<QuestionnaireRequest>
  ): Promise<Questionnaire> {
    await this.checkIfUserHasWriteAccessOnRequestedQuestionnaire(
      decodedToken,
      id,
      version
    );
    if (
      typeof changedAttributes.active === 'boolean' &&
      !changedAttributes.active
    ) {
      return await QuestionnaireService.deactivateQuestionnaire(
        id,
        version
      ).catch((err) => {
        console.log(err);
        throw Boom.badImplementation('Could not deactivate questionnaire');
      });
    }
    throw Boom.badData('Nothing was send, that changed anything.');
  }

  /**
   * revises a questionnaire from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the questionnaire to revise
   * @param revisedQuestionnaire the new questionnaire
   * @returns questionnaire
   */
  public static async reviseQuestionnaire(
    decodedToken: AccessToken,
    id: number,
    revisedQuestionnaire: QuestionnaireRequest
  ): Promise<Questionnaire> {
    await this.checkIfUserHasWriteAccessOnRequestedQuestionnaire(
      decodedToken,
      id
    );
    await this.checkIfUserHasWriteAccessForStudy(
      decodedToken,
      revisedQuestionnaire.study_id
    );
    return (await pgHelper
      .reviseQuestionnaire(revisedQuestionnaire, id)
      .catch((err) => {
        console.log(err);
        throw Boom.badImplementation('Could not revise questionnaire');
      })) as Questionnaire;
  }

  /**
   * gets a questionnaire from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the questionnaire to get
   * @param version the version of the questionnaire to get
   * @returns questionnaire
   */
  public static async getQuestionnaire(
    decodedToken: AccessToken,
    id: number,
    version: number
  ): Promise<Questionnaire> {
    const questionnaire = await QuestionnaireRepository.getQuestionnaire(
      id,
      version
    ).catch((err) => {
      console.log(err);
      throw Boom.notFound('Questionnaire does not exist');
    });
    assertStudyAccess(questionnaire.study_id, decodedToken);
    return questionnaire;
  }

  /**
   * Gets all questionnaires from DB the user has access to
   * @param decodedToken the jwt of the request
   * @returns questionnaires
   */
  public static async getQuestionnaires(
    decodedToken: AccessToken
  ): Promise<Questionnaire[]> {
    return await QuestionnaireRepository.getQuestionnairesByStudyIds(
      decodedToken.studies
    ).catch((err) => {
      console.log(err);
      return [];
    });
  }

  private static async checkIfUserHasWriteAccessForStudy(
    decodedToken: AccessToken,
    study_id: string
  ): Promise<void> {
    assertStudyAccess(study_id, decodedToken);

    // soon in the future we will get the studyAccess level from the token too!
    const studyAccess = (await pgHelper
      .getStudyAccessForUser(study_id, decodedToken.username)
      .catch((err) => {
        console.log(err);
        throw Boom.forbidden('User has no access to study');
      })) as StudyAccess;
    if (
      studyAccess.access_level !== 'write' &&
      studyAccess.access_level !== 'admin'
    ) {
      throw Boom.forbidden(
        "User has no write access for questionnaire's study"
      );
    }
  }

  private static async checkIfUserHasWriteAccessOnRequestedQuestionnaire(
    decodedToken: AccessToken,
    id: number,
    version?: number
  ): Promise<void> {
    const questionnaire = await QuestionnaireRepository.getQuestionnaire(
      id,
      version
    ).catch((err) => {
      console.log(err);
      throw Boom.notFound('Questionnaire does not exist');
    });
    if (!questionnaire.active) {
      throw Boom.preconditionFailed(
        'Questionnaire is deactivated and cannot be changed'
      );
    }
    await this.checkIfUserHasWriteAccessForStudy(
      decodedToken,
      questionnaire.study_id
    );
  }
}
