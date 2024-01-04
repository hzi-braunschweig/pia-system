/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractFeedbackStatisticGenerator } from './abstractFeedbackStatisticGenerator';
import { RelativeFrequencyTimeSeries } from './relativeFrequencyTimeSeries';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { AnswerOptionValueCodesReferenceDto } from '../model/feedbackStatisticConfiguration';
import { InsufficientDataError } from './feedbackStatisticUpdater';
import { RelativeFrequencyTimeSeriesDataDto } from '../model/relativeFrequencyTimeSeriesDto';
import { RelativeFrequencyTimeSeriesConfiguration } from '../entities/relativeFrequencyTimeSeriesConfiguration';
import { getRepository } from 'typeorm';
import {
  AnswerDataInternalDto,
  AnswerOptionReferenceInternalDto,
  AnswersFilterInternalDto,
  QuestionnaireInternalDto,
} from '@pia-system/lib-http-clients-internal';
import { TimeSpan } from '../model/timeSpan';
import { TimeRange } from '../model/timeRange';
import { ValueCodesMapper } from './valueCodesMapper';

class RelativeFrequencyTimeSeriesGenerator
  implements
    AbstractFeedbackStatisticGenerator<RelativeFrequencyTimeSeriesDataDto[]>
{
  public async generateData(
    configurationId: number
  ): Promise<RelativeFrequencyTimeSeriesDataDto[]> {
    const config = await getRepository(
      RelativeFrequencyTimeSeriesConfiguration
    ).findOneOrFail({
      where: { id: configurationId },
      relations: ['timeSeries'],
    });

    const questionnaire = await questionnaireserviceClient.getQuestionnaire(
      config.comparativeValues.questionnaire.id,
      config.comparativeValues.questionnaire.version
    );

    return await this.getRelativeFrequencyTimeSeriesData(config, questionnaire);
  }

  private async getRelativeFrequencyTimeSeriesData(
    config: RelativeFrequencyTimeSeriesConfiguration,
    questionnaire: QuestionnaireInternalDto
  ): Promise<RelativeFrequencyTimeSeriesDataDto[]> {
    const valueCodesMapper = new ValueCodesMapper(questionnaire.questions);
    let createdAt = questionnaire.createdAt;
    if (questionnaire.version > 1) {
      try {
        const firstQuestionnaireVersion =
          await questionnaireserviceClient.getQuestionnaire(
            questionnaire.id,
            1
          );
        createdAt = firstQuestionnaireVersion.createdAt;
      } catch (e) {
        console.error(
          `First version of questionnaire with id ${questionnaire.id} could not be retrieved.
           It might have been deleted. Using createdAt of the currently active version as a fallback.`,
          e
        );
      }
    }

    const timeSeries = new RelativeFrequencyTimeSeries(
      config,
      questionnaire,
      createdAt
    );

    const answersStream =
      await questionnaireserviceClient.getQuestionnaireAnswers(
        config.comparativeValues.questionnaire.id,
        this.buildAnswersFilter(config)
      );

    return new Promise((resolve, reject) => {
      answersStream
        .on('data', (answer: AnswerDataInternalDto) => {
          try {
            const valueCodes = valueCodesMapper.map(
              answer.answerOptionVariableName,
              answer.answerOptionId,
              answer.values
            );
            if (valueCodes !== null) {
              timeSeries.pushAnswer({
                questionnaireId: answer.questionnaireId,
                questionnaireInstanceId: answer.questionnaireInstanceId,
                questionnaireInstanceDateOfIssue: new Date(
                  answer.questionnaireInstanceDateOfIssue
                ),
                answerOptionId: answer.answerOptionId,
                valueCodes,
              });
            }
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => reject(error))
        .on('end', () => {
          if (timeSeries.isEmpty()) {
            reject(new InsufficientDataError());
          }
          resolve(timeSeries.getData());
        });
    });
  }

  private buildAnswersFilter(
    config: RelativeFrequencyTimeSeriesConfiguration
  ): AnswersFilterInternalDto {
    const intervalShift = TimeSpan.fromEntity(config.intervalShift);
    const dateOfIssueRange = intervalShift
      .invert()
      .shiftTimeRange(TimeRange.fromEntity(config.timeRange));

    const answerOptions: AnswerOptionReferenceInternalDto[] = [
      this.getIdOrVariableName(config.comparativeValues.answerOptionValueCodes),
      ...config.timeSeries.map((timeSeries) => {
        return this.getIdOrVariableName(timeSeries.answerOptionValueCodes);
      }),
    ];

    return {
      status: ['released', 'released_once', 'released_twice'],
      minDateOfIssue: dateOfIssueRange.startDate,
      maxDateOfIssue: dateOfIssueRange.endDate ?? new Date(),
      answerOptions,
    };
  }

  private getIdOrVariableName(
    answerOption: AnswerOptionValueCodesReferenceDto
  ): AnswerOptionReferenceInternalDto {
    if (answerOption.variableName) {
      return { variableName: answerOption.variableName };
    } else {
      return { id: answerOption.id };
    }
  }
}

export const relativeFrequencyTimeSeriesGenerator =
  new RelativeFrequencyTimeSeriesGenerator();
