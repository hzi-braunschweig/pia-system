/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { userserviceClient } from '../clients/userserviceClient';
import { GetQuestionnaireInstanceResponseDto } from '../controllers/public/dtos/getQuestionnaireInstanceDtos';
import {
  PatchQuestionnaireInstanceRequestDto,
  PatchQuestionnaireInstanceResponseDto,
} from '../controllers/public/dtos/patchQuestionnaireInstanceDtos';
import {
  PostAnswerRequestDto,
  PostAnswerResponseDto,
} from '../controllers/public/dtos/postAnswerDto';
import { Answer } from '../entities/answer';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import {
  InvalidAnswersError,
  QuestionOrAnswerOptionNotFoundError,
  ReleaseNeedsAnswersError,
  StudyNotFoundError,
} from '../errors';
import { PartialAnswerDto } from '../models/answer';
import { StudyName } from '../models/customTypes';
import { CustomName } from '../models/questionnaire';
import { QuestionnaireInstanceStatus } from '../models/questionnaireInstance';
import { AnswerService } from './answerService';
import { AnswerValidatorService } from './answerValidatorService';
import { QuestionnaireInstanceService } from './questionnaireInstanceService';
import { Pseudonym } from '@pia/lib-publicapi';

export class QuestionnaireFacade {
  public static async getQuestionnaireInstances(
    studyName: StudyName,
    pseudonym: Pseudonym,
    customName?: CustomName,
    status?: QuestionnaireInstanceStatus
  ): Promise<GetQuestionnaireInstanceResponseDto[]> {
    if (!(await userserviceClient.getStudy(studyName))) {
      throw new StudyNotFoundError(studyName);
    }

    const result = await QuestionnaireInstanceService.getQuestionnaireInstances(
      studyName,
      pseudonym,
      customName,
      status
    );

    return result.map((instance) => ({
      id: instance.id,
      studyName: instance.studyId,
      questionnaireId: instance.questionnaire.id,
      questionnaireVersion: instance.questionnaire.version,
      questionnaireCustomName: instance.questionnaire.customName,
      questionnaireName: instance.questionnaireName,
      sortOrder: instance.sortOrder,
      pseudonym: instance.pseudonym,
      dateOfIssue: instance.dateOfIssue,
      dateOfReleaseV1: instance.dateOfReleaseV1,
      dateOfReleaseV2: instance.dateOfReleaseV2,
      cycle: instance.cycle,
      status: instance.status,
      notificationsScheduled: instance.notificationsScheduled,
      progress: instance.progress,
      releaseVersion: instance.releaseVersion,
    }));
  }

  public static async patchInstance(
    identifier: CustomName | number,
    studyName: string,
    pseudonym: string,
    instanceDto: PatchQuestionnaireInstanceRequestDto
  ): Promise<PatchQuestionnaireInstanceResponseDto> {
    if (!(await userserviceClient.getStudy(studyName))) {
      throw new StudyNotFoundError(studyName);
    }

    const instance = await QuestionnaireInstanceService.get(
      identifier,
      studyName,
      pseudonym
    );

    const nextReleaseVersion =
      QuestionnaireInstanceService.determineReleaseVersion(
        instance,
        instanceDto.status
      );

    const countAnswers = await AnswerService.count(
      instance,
      nextReleaseVersion
    );

    if (instanceDto.status === 'released' && countAnswers === 0) {
      throw new ReleaseNeedsAnswersError(
        `Questionnaire instance ${instance.id} has no answers for release version ${nextReleaseVersion}`
      );
    }

    if (instanceDto.status === 'released_twice' && countAnswers === 0) {
      await AnswerService.copyToVersion(instance, nextReleaseVersion);
    }

    const { status, progress, releaseVersion } =
      await QuestionnaireInstanceService.patchInstance(instance, {
        status: instanceDto.status,
        progress: await QuestionnaireInstanceService.calculateProgress(
          instance
        ),
        releaseVersion: nextReleaseVersion,
      });

    return { status, progress, releaseVersion };
  }

  public static async postAnswers(
    studyName: StudyName,
    pseudonym: Pseudonym,
    identifier: number | CustomName,
    answersDto: PostAnswerRequestDto[]
  ): Promise<PostAnswerResponseDto[]> {
    const study = await userserviceClient.getStudy(studyName);

    if (!study) {
      throw new StudyNotFoundError(studyName);
    }

    const instance = await QuestionnaireInstanceService.get(
      identifier,
      studyName,
      pseudonym
    );

    const answers = this.transformDtoToPartialAnswer(instance, answersDto);

    const validationResults = await AnswerValidatorService.validate(
      study,
      instance,
      answers
    );

    if (validationResults.some((r) => r.error !== null)) {
      throw new InvalidAnswersError(
        AnswerValidatorService.createErrorMessage(validationResults)
      );
    }

    const saveResult = await AnswerService.createOrUpdate(instance, answers);

    await QuestionnaireInstanceService.updateProgress(instance);

    return Promise.all(
      saveResult.map(async (a: Answer) => {
        if (
          !a.dateOfRelease ||
          !a.answerOption?.variableName ||
          !a.question?.variableName
        ) {
          throw Error(
            'could not create response as the created answer seems to be incomplete'
          );
        }

        return {
          dateOfRelease: a.dateOfRelease.toISOString(),
          questionVariableName: a.question.variableName,
          answerOptionVariableName: a.answerOption.variableName,
          value: await AnswerService.decodeAnswerValue(a.answerOption, a.value),
          version: a.versioning,
          type: AnswerService.getAnswerTypeString(a.answerOption.answerTypeId),
        };
      })
    );
  }

  private static transformDtoToPartialAnswer(
    instance: QuestionnaireInstance,
    answersDto: PostAnswerRequestDto[]
  ): PartialAnswerDto[] {
    return answersDto.map((answerDto) => {
      const question = instance.questionnaire?.questions?.find(
        (q) => q.variableName === answerDto.questionVariableName
      );
      const answerOption = question?.answerOptions?.find(
        (ao) => ao.variableName === answerDto.answerOptionVariableName
      );

      if (!question || !answerOption) {
        throw new QuestionOrAnswerOptionNotFoundError(
          answerOption ?? { variableName: answerDto.answerOptionVariableName },
          question ?? { variableName: answerDto.questionVariableName }
        );
      }

      return {
        answerOption,
        question,
        value: answerDto.value,
      };
    });
  }
}
