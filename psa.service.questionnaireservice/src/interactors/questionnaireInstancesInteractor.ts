/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AccessToken,
  assertStudyAccess,
  getPrimaryRealmRole,
} from '@pia/lib-service-core';
import {
  QuestionnaireInstance as QuestionnaireInstanceDeprecated,
  QuestionnaireInstanceForPM,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { QuestionnaireInstanceService } from '../services/questionnaireInstanceService';

/**
 * @description interactor that handles questionnaire instance requests based on users permissions
 */
export class QuestionnaireInstancesInteractor {
  public static async getQuestionnaireInstance(
    decodedToken: AccessToken,
    id: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    switch (getPrimaryRealmRole(decodedToken)) {
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
          result.user_id === decodedToken.username &&
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
        assertStudyAccess(qInstanceResult.study_id, decodedToken);
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
        assertStudyAccess(qInstanceResult.study_id, decodedToken);
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
    return QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsProband(
      decodedToken.username,
      status
    ).catch((err) => {
      console.log(err);
      return [];
    });
  }

  public static async getQuestionnaireInstancesForUser(
    decodedToken: AccessToken,
    user_id: string
  ): Promise<QuestionnaireInstanceDeprecated[] | QuestionnaireInstanceForPM[]> {
    let probandQIs:
      | QuestionnaireInstanceDeprecated[]
      | QuestionnaireInstanceForPM[] = [];

    try {
      switch (getPrimaryRealmRole(decodedToken)) {
        case 'Forscher': {
          probandQIs =
            await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsResearcher(
              user_id
            );
          break;
        }
        case 'ProbandenManager': {
          probandQIs =
            await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsPM(
              user_id
            );
          break;
        }
        case 'Untersuchungsteam': {
          probandQIs =
            await QuestionnaireInstanceRepository.getQuestionnaireInstancesAsInvestigator(
              user_id
            );
          break;
        }
      }
    } catch (err) {
      console.log(err);
    }
    return probandQIs.filter((probandQI) =>
      decodedToken.studies.includes(probandQI.study_id)
    );
  }

  public static async updateQuestionnaireInstance(
    decodedToken: AccessToken,
    id: number,
    status: QuestionnaireInstanceStatus | null,
    progress: number,
    releaseVersion: number | null
  ): Promise<QuestionnaireInstanceDeprecated> {
    switch (getPrimaryRealmRole(decodedToken)) {
      case 'Proband': {
        const currentInstance =
          await QuestionnaireInstanceService.getQuestionnaireInstance(id, {
            questionnaireType: 'for_probands',
            excludeStatus: 'deleted',
          }).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not update questionnaire instance, because it does not exist'
            );
          });

        if (currentInstance.pseudonym !== decodedToken.username) {
          throw new Error(
            'Could not update questionnaire instance, because user has no access'
          );
        }

        return await QuestionnaireInstanceService.patchInstance(
          currentInstance,
          {
            ...(status ? { status } : {}),
            ...(releaseVersion ? { releaseVersion } : {}),
            progress,
          },
          true
        ).catch((err) => {
          console.log(err);
          throw new Error(
            'Could not update questionnaire instance: internal DB error'
          );
        });
      }
      case 'Untersuchungsteam': {
        const currentInstance =
          await QuestionnaireInstanceService.getQuestionnaireInstance(id, {
            questionnaireType: 'for_research_team',
            excludeStatus: 'deleted',
          }).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist or UT has no access'
            );
          });

        assertStudyAccess(currentInstance.studyId, decodedToken);

        return await QuestionnaireInstanceService.patchInstance(
          currentInstance,
          {
            ...(status ? { status } : {}),
            ...(releaseVersion ? { releaseVersion } : {}),
            progress,
          },
          true
        ).catch((err) => {
          console.log(err);
          throw new Error(
            'Could not update questionnaire instance: internal DB error'
          );
        });
      }
      default:
        throw new Error(
          'Could not update questionnaire instance: Unknown or wrong role'
        );
    }
  }
}
