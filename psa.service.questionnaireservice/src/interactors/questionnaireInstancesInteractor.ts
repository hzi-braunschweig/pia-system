/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken } from '@pia/lib-service-core';
import {
  QuestionnaireInstance as QuestionnaireInstanceDeprecated,
  QuestionnaireInstanceForPM,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';

import { messageQueueService } from '../services/messageQueueService';

/**
 * @description interactor that handles questionnaire instance requests based on users permissions
 */
export class QuestionnaireInstancesInteractor {
  public static async getQuestionnaireInstance(
    decodedToken: AccessToken,
    id: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist'
            );
          });
        if (result.questionnaire.questions.length === 0)
          throw new Error(
            'Could not get questionnaire instance, because conditions are not fulfilled'
          );
        if (result.questionnaire.type !== 'for_probands') {
          throw new Error(
            'Probands can only get instances with type for_probands'
          );
        }
        if (
          result.user_id === userName &&
          result.status !== 'inactive' &&
          result.status !== 'expired' &&
          result.status !== 'deleted'
        ) {
          return result;
        } else {
          throw new Error(
            'Could not get questionnaire instance, because user has no access'
          );
        }
      }
      case 'Untersuchungsteam': {
        const qInstanceResult =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist'
            );
          });
        if (qInstanceResult.questionnaire.questions.length === 0)
          throw new Error(
            'Could not get questionnaire instance, because conditions are not fulfilled'
          );
        if (qInstanceResult.questionnaire.type !== 'for_research_team') {
          throw new Error(
            'UT can only get instances with type for_research_team'
          );
        }
        if (!userStudies.includes(qInstanceResult.study_id)) {
          throw new Error(
            'Could not get questionnaire instance, because user has no access to study'
          );
        }
        if (
          qInstanceResult.status !== 'inactive' &&
          qInstanceResult.status !== 'expired' &&
          qInstanceResult.status !== 'deleted'
        ) {
          return qInstanceResult;
        } else {
          throw new Error(
            'Could not get questionnaire instance, because user has no access'
          );
        }
      }

      case 'Forscher': {
        const qInstanceResult =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist'
            );
          });
        if (qInstanceResult.questionnaire.questions.length === 0)
          throw new Error(
            'Could not get questionnaire instance, because conditions are not fulfilled'
          );
        if (!userStudies.includes(qInstanceResult.study_id)) {
          throw new Error(
            'Could not get questionnaire instance, because user has no access to study'
          );
        }
        return qInstanceResult;
      }

      default:
        throw new Error(
          'Could not get questionnaire instance: Unknown role or no role specified'
        );
    }
  }

  public static async getQuestionnaireInstances(
    decodedToken: AccessToken,
    status: QuestionnaireInstanceStatus[]
  ): Promise<QuestionnaireInstanceDeprecated[]> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        return QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsProband(
          userName,
          status
        ).catch((err) => {
          console.log(err);
          return [];
        });
      default:
        throw new Error(
          'Could not get questionnaire instances, because user role is not valid'
        );
    }
  }

  public static async getQuestionnaireInstancesForUser(
    decodedToken: AccessToken,
    user_id: string
  ): Promise<QuestionnaireInstanceDeprecated[] | QuestionnaireInstanceForPM[]> {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Forscher': {
        const probandQIs =
          await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsResearcher(
            user_id
          ).catch((err) => {
            console.log(err);
            return [];
          });
        return probandQIs.filter((probandQI) =>
          userStudies.includes(probandQI.study_id)
        );
      }
      case 'ProbandenManager': {
        const probandQIs =
          await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsPM(
            user_id
          ).catch((err) => {
            console.log(err);
            return [];
          });
        return probandQIs.filter((probandQI) =>
          userStudies.includes(probandQI.study_id)
        );
      }
      case 'Untersuchungsteam': {
        const probandQIs =
          await QuestionnaireInstanceRepository.getQuestionnaireInstancesAsInvestigator(
            user_id
          ).catch((err) => {
            console.log(err);
            return [];
          });
        return probandQIs.filter((probandQI) =>
          userStudies.includes(probandQI.study_id)
        );
      }
      default:
        throw new Error(
          'Could not get questionnaire instance: Unknown role or no role specified'
        );
    }
  }

  public static async updateQuestionnaireInstance(
    decodedToken: AccessToken,
    id: number,
    status: QuestionnaireInstanceStatus | null,
    progress: number,
    release_version: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Proband': {
        const currentInstance =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not update questionnaire instance, because it does not exist'
            );
          });
        if (currentInstance.user_id === userName) {
          if (
            !status ||
            this.isAllowedStatusTransitionForProband(
              currentInstance.status,
              status
            )
          ) {
            const result =
              await QuestionnaireInstanceRepository.updateQuestionnaireInstance(
                id,
                status,
                progress,
                release_version
              ).catch((err) => {
                console.log(err);
                throw new Error(
                  'Could not update questionnaire instance: internal DB error'
                );
              });

            if (status === 'released_once' || status === 'released_twice') {
              await messageQueueService.sendQuestionnaireInstanceReleased(
                id,
                release_version
              );
            }
            return result;
          } else {
            throw new Error(
              'Could not update questionnaire instance, wrong status transition'
            );
          }
        } else {
          throw new Error(
            'Could not update questionnaire instance, because user has no access'
          );
        }
      }
      case 'Untersuchungsteam': {
        const currentInstance =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist or UT has no access'
            );
          });
        if (
          !status ||
          this.isAllowedStatusTransitionForInvestigator(
            currentInstance.status,
            status
          )
        ) {
          if (userStudies.includes(currentInstance.study_id)) {
            const result =
              await QuestionnaireInstanceRepository.updateQuestionnaireInstance(
                id,
                status,
                progress,
                release_version
              ).catch((err) => {
                console.log(err);
                throw new Error(
                  'Could not update questionnaire instance: internal DB error'
                );
              });
            if (status === 'released') {
              await messageQueueService.sendQuestionnaireInstanceReleased(
                id,
                release_version
              );
            }
            return result;
          } else {
            throw new Error(
              'Could not get questionnaire instances because UT has no access'
            );
          }
        } else {
          throw new Error(
            'Could not update questionnaire instance, wrong status transition'
          );
        }
      }
      default:
        throw new Error(
          'Could not update questionnaire instance: Unknown or wrong role'
        );
    }
  }

  private static isAllowedStatusTransitionForProband(
    oldStatus: QuestionnaireInstanceStatus,
    newStatus: QuestionnaireInstanceStatus
  ): boolean {
    switch (oldStatus) {
      case 'active':
        return newStatus === 'in_progress' || newStatus === 'released_once';
      case 'in_progress':
        return newStatus === 'released_once';
      case 'released_once':
        return newStatus === 'released_twice';
      default:
        return false;
    }
  }

  private static isAllowedStatusTransitionForInvestigator(
    oldStatus: QuestionnaireInstanceStatus,
    newStatus: QuestionnaireInstanceStatus
  ): boolean {
    switch (oldStatus) {
      case 'active':
        return newStatus === 'in_progress' || newStatus === 'released';
      case 'in_progress':
        return newStatus === 'released';
      case 'released':
        return newStatus === 'released';
      default:
        return false;
    }
  }
}
