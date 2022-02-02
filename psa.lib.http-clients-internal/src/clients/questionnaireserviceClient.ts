/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import {
  QuestionnaireInstanceInternalDto,
  QuestionnaireInstanceWithQuestionnaireInternalDto,
} from '../dtos/questionnaireInstance';
import { AnswerInternalDto } from '../dtos/answer';
import { QuestionnaireInternalDto } from '../dtos/questionnaire';

export class QuestionnaireserviceClient extends ServiceClient {
  private static convertQuestionnaireInstanceDates<
    T extends
      | QuestionnaireInstanceInternalDto
      | QuestionnaireInstanceWithQuestionnaireInternalDto
  >(qinstance: T): T {
    const newInstance = {
      ...qinstance,
      dateOfIssue: new Date(qinstance.dateOfIssue),
      dateOfReleaseV1:
        qinstance.dateOfReleaseV1 && new Date(qinstance.dateOfReleaseV1),
      dateOfReleaseV2:
        qinstance.dateOfReleaseV2 && new Date(qinstance.dateOfReleaseV2),
      transmissionTsV1:
        qinstance.transmissionTsV1 && new Date(qinstance.transmissionTsV1),
      transmissionTsV2:
        qinstance.transmissionTsV2 && new Date(qinstance.transmissionTsV2),
    };
    if ('questionnaire' in qinstance) {
      return {
        ...newInstance,
        questionnaire: QuestionnaireserviceClient.convertQuestionnaireDates(
          qinstance.questionnaire
        ),
      };
    }
    return newInstance;
  }

  private static convertQuestionnaireDates(
    questionnaire: QuestionnaireInternalDto
  ): QuestionnaireInternalDto {
    return {
      ...questionnaire,
      activateAtDate:
        questionnaire.activateAtDate && new Date(questionnaire.activateAtDate),
      createdAt: questionnaire.createdAt && new Date(questionnaire.createdAt),
      updatedAt: questionnaire.updatedAt && new Date(questionnaire.updatedAt),
    };
  }

  /**
   * Gets all pseudonyms from pia that are in a specific study or have a specific status account
   */
  public async getQuestionnaireInstancesForProband(
    pseudonym: string
  ): Promise<QuestionnaireInstanceInternalDto[]> {
    const params = new URLSearchParams();
    // The questionnaire is currently not needed and not supported by the TS interface
    params.append('loadQuestionnaire', String(false));
    const query = '?' + params.toString();

    const instances = await this.httpClient.get<
      QuestionnaireInstanceInternalDto[]
    >(`/questionnaire/user/${pseudonym}/questionnaireInstances` + query);

    return instances.map((instance) =>
      QuestionnaireserviceClient.convertQuestionnaireInstanceDates(instance)
    );
  }

  /**
   * Gets all pseudonyms from pia that are in a specific study or have a specific status account
   */
  public async getQuestionnaireInstance(
    id: number,
    filterQuestionnaireByConditions?: boolean
  ): Promise<QuestionnaireInstanceWithQuestionnaireInternalDto> {
    const params = new URLSearchParams();
    params.append(
      'filterQuestionnaireByConditions',
      String(filterQuestionnaireByConditions ?? false)
    );
    const query = '?' + params.toString();
    const result =
      await this.httpClient.get<QuestionnaireInstanceWithQuestionnaireInternalDto>(
        `/questionnaire/questionnaireInstances/${id.toString()}` + query
      );
    return QuestionnaireserviceClient.convertQuestionnaireInstanceDates(result);
  }

  public async getQuestionnaireInstanceAnswers(
    id: number
  ): Promise<AnswerInternalDto[]> {
    return await this.httpClient.get<AnswerInternalDto[]>(
      `/questionnaire/questionnaireInstances/${id.toString()}/answers`
    );
  }
}
