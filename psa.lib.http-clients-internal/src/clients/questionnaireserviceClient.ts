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
import { AnswerInternalDto, AnswersFilterInternalDto } from '../dtos/answer';
import { QuestionnaireInternalDto } from '../dtos/questionnaire';
import { HttpClient } from '../core/httpClient';
import { StatusCodes } from 'http-status-codes';
import Boom from '@hapi/boom';
import { JsonChunksParserTransform } from '../core/jsonChunksParserTransform';

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

  public async getQuestionnaire(
    id: number,
    version: number
  ): Promise<QuestionnaireInternalDto> {
    return await this.httpClient.get<QuestionnaireInternalDto>(
      `/questionnaire/${id.toString()}/${version.toString()}`
    );
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

  public async getQuestionnaireAnswers(
    id: number,
    filter: AnswersFilterInternalDto
  ): Promise<NodeJS.ReadableStream> {
    const params = new URLSearchParams();
    if (filter.status) {
      filter.status.forEach((status) => params.append('status', status));
    }
    if (filter.minDateOfIssue) {
      params.append('minDateOfIssue', filter.minDateOfIssue.toISOString());
    }
    if (filter.maxDateOfIssue) {
      params.append('maxDateOfIssue', filter.maxDateOfIssue.toISOString());
    }
    if (filter.answerOptions && filter.answerOptions.length > 0) {
      filter.answerOptions
        .map((a) => a.id)
        .filter(Boolean)
        .forEach((answerOptionId) =>
          params.append('answerOptionIds', answerOptionId!.toString())
        );

      filter.answerOptions
        .map((a) => a.variableName)
        .filter(Boolean)
        .forEach((variableName) =>
          params.append('answerOptionVariableNames', variableName!.toString())
        );
    }

    const url = `${
      this.serviceUrl
    }/questionnaire/${id.toString()}/answers?${params.toString()}`;

    const res = await HttpClient.fetch(url);

    if (!res.ok) {
      if (res.status === StatusCodes.NOT_FOUND) {
        throw Boom.notFound(`GET ${url} received a 404 Not Found`);
      }
      throw Boom.internal(
        `GET ${url} received an Error`,
        await res.text(),
        res.status
      );
    }

    return res.body.pipe(new JsonChunksParserTransform());
  }
}
