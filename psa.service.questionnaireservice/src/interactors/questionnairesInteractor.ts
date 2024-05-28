/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { AccessToken, assertStudyAccess } from '@pia/lib-service-core';
import { DatabaseError } from 'pg-protocol';
import {
  CouldNotCreateNewRandomVariableNameError,
  CouldNotUpdateGeneratedCustomName,
  VariableNameHasBeenReusedError,
} from '../errors';
import variableNameGenerator from '../helpers/variableNameGenerator';
import { Questionnaire, QuestionnaireRequest } from '../models/questionnaire';
import { StudyAccess } from '../models/studyAccess';
import { QuestionnaireRepository } from '../repositories/questionnaireRepository';
import pgHelper from '../services/postgresqlHelper';
import { QuestionnaireService } from '../services/questionnaireService';

const GENERATED_VARIABLE_DIGITS_LENGTH = 8;

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

    try {
      this.generateAndSetVariableNames(questionnaire);
      this.validateVariableNamesUsage(questionnaire);

      const result = (await pgHelper.insertQuestionnaire(
        questionnaire
      )) as Questionnaire;

      await this.generateAndUpdateCustomName(result);

      return result;
    } catch (e) {
      this.handleCustomNameErrors(e);
      this.handleVariableNameError(e);

      console.log(e);
      throw Boom.badImplementation('Could not create questionnaire');
    }
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
        this.handleCustomNameErrors(err);

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

    try {
      // If all questions from the current questionnaire version have variable
      // names set, we assume empty variable names in a new revision should be
      // filled with automatically generated ones.
      if (await this.currentQuestionnaireHasCompleteVariableNames(id)) {
        this.generateAndSetVariableNames(revisedQuestionnaire);
      }

      this.validateVariableNamesUsage(revisedQuestionnaire);

      return (await pgHelper.reviseQuestionnaire(
        revisedQuestionnaire,
        id
      )) as Questionnaire;
    } catch (e: unknown) {
      this.handleCustomNameErrors(e);
      this.handleVariableNameError(e);

      console.log(e);
      throw Boom.badImplementation('Could not revise questionnaire');
    }
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

  /**
   * Will fetch the current questionnaire version and return true,
   * when all questions and answer options have variable names set.
   */
  private static async currentQuestionnaireHasCompleteVariableNames(
    id: number
  ): Promise<boolean> {
    const questionnaire = await QuestionnaireRepository.getQuestionnaire(id);

    return questionnaire.questions.every(
      (q) =>
        Boolean(q.variable_name) &&
        q.answer_options.every((ao) => Boolean(ao.variable_name))
    );
  }

  /**
   * Generates and updates a questionnaires custom name, if the custom name is empty.
   * The questionnaire has to be created in advanced, because we need an ID, which will
   * be used as a suffix to ensure uniqueness.
   *
   * The given questionnaire object will be mutated and the value for custom_name set
   * to the generated name.
   */
  private static async generateAndUpdateCustomName(
    questionnaire: Questionnaire
  ): Promise<void> {
    if (questionnaire.custom_name !== null) {
      return;
    }

    questionnaire.custom_name =
      await QuestionnaireService.generateAndUpdateCustomName(questionnaire);
  }

  /**
   * Adds variable names when not set by mutating questions and answer options
   * of the given questionnaire
   */
  private static generateAndSetVariableNames(
    questionnaire: QuestionnaireRequest
  ): void {
    const unavailableNames: string[] = [];

    questionnaire.questions?.forEach((question) => {
      if (!question.variable_name) {
        question.variable_name = variableNameGenerator(
          GENERATED_VARIABLE_DIGITS_LENGTH,
          unavailableNames
        );
        unavailableNames.push(question.variable_name);
      }

      question.answer_options
        ?.filter((ao) => !ao.variable_name)
        .forEach((answerOption) => {
          answerOption.variable_name = variableNameGenerator(
            GENERATED_VARIABLE_DIGITS_LENGTH,
            unavailableNames
          );
          unavailableNames.push(answerOption.variable_name);
        });
      return question;
    });
  }

  private static handleCustomNameErrors(e: unknown): void {
    if (e instanceof DatabaseError && e.constraint === 'unique_custom_name') {
      throw Boom.badRequest('Custom name is already in use');
    } else if (e instanceof CouldNotUpdateGeneratedCustomName) {
      throw Boom.internal(e.message);
    }
  }

  private static handleVariableNameError(e: unknown): void {
    if (e instanceof CouldNotCreateNewRandomVariableNameError) {
      throw Boom.conflict('Could not create a new random variable name');
    } else if (e instanceof VariableNameHasBeenReusedError) {
      throw Boom.conflict(e.message);
    }
  }

  /**
   * Validates if variable names are used only once for questions and once for answer options below a question.
   * @throws Error when variable names are not unique according to these rules.
   */
  private static validateVariableNamesUsage(
    questionnaire: QuestionnaireRequest
  ): void {
    /**
     * Tracks the usage of a variable name by its questions position
     */
    const questionVariableNames = new Map<string, number>();

    /**
     * Tracks the usage of a variable name by its answer options position.
     * The tuple represents `[question.position, answer_option.position]`
     */
    const answerOptionVariableNames = new Map<string, [number, number]>();

    questionnaire.questions?.forEach((question) => {
      if (questionVariableNames.has(question.variable_name)) {
        const declaringQuestionNumber = questionVariableNames.get(
          question.variable_name
        );
        throw new VariableNameHasBeenReusedError(
          `Question #${question.position} declares variable name "${
            question.variable_name
          }" which has already been declared in Question #${String(
            declaringQuestionNumber
          )}`
        );
      }

      if (question.variable_name) {
        questionVariableNames.set(question.variable_name, question.position);
      }

      question.answer_options?.forEach((answerOption) => {
        if (
          answerOption.variable_name &&
          answerOptionVariableNames.has(answerOption.variable_name)
        ) {
          const [questionPos, answerOptionPos] =
            answerOptionVariableNames.get(answerOption.variable_name) ?? [];

          if (
            questionPos &&
            answerOptionPos &&
            questionPos === question.position
          ) {
            throw new VariableNameHasBeenReusedError(
              `Answer option #${question.position}.${answerOption.position} declares variable name "${answerOption.variable_name}" which has already been declared in answer option #${questionPos}.${answerOptionPos}`
            );
          }
        }

        if (answerOption.variable_name) {
          answerOptionVariableNames.set(answerOption.variable_name, [
            question.position,
            answerOption.position,
          ]);
        }
      });
    });
  }
}
