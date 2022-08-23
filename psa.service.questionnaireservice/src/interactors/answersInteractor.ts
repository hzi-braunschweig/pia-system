/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';

import pgHelper from '../services/postgresqlHelper';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { isFileContentAllowed } from '../services/answerTypesValidator';
import {
  AccessToken,
  assertStudyAccess,
  getPrimaryRealmRole,
} from '@pia/lib-service-core';
import { WrongRoleError } from '../errors';
import { Answer, PostAnswersRequest } from '../models/answer';

/**
 * @description interactor that handles answers requests based on users permissions
 */
export class AnswersInteractor {
  private static readonly answerVersionOne = 1;
  private static readonly answerVersionTwo = 2;

  /**
   * Creates or updates answers for a questionnaire instance
   */
  public static async createOrUpdateAnswers(
    decodedToken: AccessToken,
    qInstanceId: number,
    answers: PostAnswersRequest['answers'],
    version: number,
    dateOfRelease: string | undefined
  ): Promise<Answer[]> {
    const userRole = getPrimaryRealmRole(decodedToken);

    if (!(await isFileContentAllowed(answers, userRole))) {
      throw Boom.forbidden(
        'Could not update answers: one of the answer has a not allowed file/image type'
      );
    }

    switch (userRole) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            qInstanceId
          ).catch(this.handleError('create or update'));

        if (
          result.user_id !== decodedToken.username ||
          (result.status !== 'active' &&
            result.status !== 'in_progress' &&
            result.status !== 'released_once')
        ) {
          throw Boom.forbidden(
            'Could not update answers for questionnaire instance, because user has no access'
          );
        }

        if (result.status === 'released_once') {
          version = this.answerVersionTwo;
        }

        return pgHelper.createOrUpdateAnswers(
          qInstanceId,
          answers,
          version
        ) as Promise<Answer[]>;
      }
      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            qInstanceId
          ).catch(this.handleError('create or update'));

        assertStudyAccess(result.study_id, decodedToken);

        return pgHelper.createOrUpdateAnswers(
          qInstanceId,
          answers,
          version,
          dateOfRelease,
          dateOfRelease ? decodedToken.username : null
        ) as Promise<Answer[]>;
      }
      default:
        throw new WrongRoleError(
          'Could not update answers for questionnaire instance: Unknown or wrong role'
        );
    }
  }

  /**
   * Gets the answers for a questionnaire instance
   */
  public static async getAnswers(
    decodedToken: AccessToken,
    qInstanceId: number
  ): Promise<Answer[]> {
    switch (getPrimaryRealmRole(decodedToken)) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            qInstanceId
          ).catch(this.handleError('get'));

        if (
          result.user_id !== decodedToken.username ||
          result.status === 'deleted'
        ) {
          throw Boom.forbidden(
            'Could not get answers for questionnaire instance, because user has no access'
          );
        }

        return pgHelper.getAnswersForProband(qInstanceId) as Promise<Answer[]>;
      }

      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            qInstanceId
          ).catch(this.handleError('get'));

        assertStudyAccess(result.study_id, decodedToken);

        return pgHelper.getAnswersForProband(qInstanceId) as Promise<Answer[]>;
      }
      case 'Forscher': {
        const qInstanceResult =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForResearcher(
            qInstanceId
          ).catch(this.handleError('get'));

        assertStudyAccess(qInstanceResult.study_id, decodedToken);

        if (
          qInstanceResult.status !== 'released' &&
          qInstanceResult.status !== 'released_once' &&
          qInstanceResult.status !== 'released_twice' &&
          qInstanceResult.status !== 'deleted'
        ) {
          throw Boom.conflict(
            'Could not get answers for questionnaire instance, because they are not released or deleted'
          );
        }

        return pgHelper.getAnswersForForscher(qInstanceId) as Promise<Answer[]>;
      }
      default:
        throw new WrongRoleError(
          'Could not get answers for questionnaire instance: Unknown or wrong role'
        );
    }
  }

  /**
   * Gets the historical answers for a questionnaire instance
   */
  public static async getAnswersHistorical(
    decodedToken: AccessToken,
    qInstanceId: number
  ): Promise<Answer[]> {
    const result =
      await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
        qInstanceId
      ).catch(this.handleError('get'));

    assertStudyAccess(result.study_id, decodedToken);

    return pgHelper.getHistoricalAnswersForInstance(qInstanceId) as Promise<
      Answer[]
    >;
  }

  /**
   * Deletes an answer of a questionnaire instance
   */
  public static async deleteAnswer(
    decodedToken: AccessToken,
    qInstanceId: number,
    answerOptionId: number
  ): Promise<void> {
    const userName = decodedToken.username;

    switch (getPrimaryRealmRole(decodedToken)) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            qInstanceId
          ).catch(this.handleError('delete'));

        if (
          result.user_id !== userName ||
          (result.status !== 'active' &&
            result.status !== 'in_progress' &&
            result.status !== 'released' &&
            result.status !== 'released_once')
        ) {
          throw Boom.forbidden(
            'Could not delete answer for questionnaire instance, because user has no access'
          );
        }

        const answerVersion =
          result.status === 'released_once'
            ? this.answerVersionTwo
            : this.answerVersionOne;

        return await pgHelper
          .deleteAnswer(qInstanceId, answerOptionId, answerVersion)
          .catch(this.handleError('delete'));
      }
      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            qInstanceId
          ).catch(this.handleError('delete'));

        assertStudyAccess(result.study_id, decodedToken);

        return await pgHelper.deleteAnswer(qInstanceId, answerOptionId);
      }
      default:
        throw new WrongRoleError(
          'Could not delete answer for questionnaire instance: Unknown or wrong role'
        );
    }
  }

  private static handleError(action: string): (err: Error) => never {
    return (err: Error): never => {
      console.log(err);
      throw Boom.notFound(
        `Could not ${action} answers. Questionnaire instance does not exist`
      );
    };
  }
}
