/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Boom } from '@hapi/boom';

import { publicApiSecurity } from '@pia/lib-service-core';
import { ValidateError } from '@tsoa/runtime';
import { StatusCodes } from 'http-status-codes';
import {
  Body,
  Controller,
  Example,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import {
  CouldNotCreateOrUpdateAnswersError,
  InvalidAnswersError,
  InvalidQuestionnaireCycleUnitError,
  InvalidStatusTransitionError,
  QuestionnaireInstanceNotFoundError,
  QuestionOrAnswerOptionNotFoundError,
  ReleaseNeedsAnswersError,
  SampleTrackingServiceRejectedSampleIdError,
  StudyNotFoundError,
} from '../../errors';
import { StudyName } from '../../models/customTypes';
import { Pseudonym } from '../../models/pseudonym';
import { CustomName } from '../../models/questionnaire';
import {
  QuestionnaireInstanceIdentifier,
  QuestionnaireInstanceStatus,
} from '../../models/questionnaireInstance';
import { QuestionnaireFacade } from '../../services/questionnaireFacade';
import { GetQuestionnaireInstanceResponseDto } from './dtos/getQuestionnaireInstanceDtos';
import {
  PatchQuestionnaireInstanceRequestDto,
  PatchQuestionnaireInstanceResponseDto,
} from './dtos/patchQuestionnaireInstanceDtos';
import {
  PostAnswerRequestDto,
  PostAnswerResponseDto,
} from './dtos/postAnswerDto';

@Route(
  'public/studies/{studyName}/participants/{pseudonym}/questionnaire-instances'
)
@Tags('Questionnaire Instances')
export class QuestionnaireInstanceController extends Controller {
  /**
   * Get questionnaire instances for a participant of a study
   *
   * @param studyName Name of the study
   * @param pseudonym Pseudonym of the participant
   * @param questionnaireCustomName Filter by custom name of associated questionnaire
   * @param status Filter by questionnaire instance status
   */
  @SuccessResponse(StatusCodes.OK)
  @Response<StudyNotFoundError>(StatusCodes.NOT_FOUND, 'Study does not exist')
  @Response<QuestionnaireInstanceNotFoundError>(
    StatusCodes.NOT_FOUND,
    'Questionnaire instance was not found'
  )
  @Response<Error>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An internal error occurred'
  )
  @Security(publicApiSecurity)
  @Get('')
  public async getQuestionnaireInstances(
    @Path() studyName: StudyName,
    @Path() pseudonym: Pseudonym,
    @Query() questionnaireCustomName?: CustomName,
    @Query() status?: QuestionnaireInstanceStatus
  ): Promise<GetQuestionnaireInstanceResponseDto[]> {
    try {
      return await QuestionnaireFacade.getQuestionnaireInstances(
        studyName,
        pseudonym,
        questionnaireCustomName,
        status
      );
    } catch (e: unknown) {
      this.handleCommonErrors(e);
      this.internalServerError(e);
    }
  }

  /**
   * Update a questionnaire instance by ID or a custom name.
   * Using a custom name as an identifier is only supported for questionnaires with a cycle unit of 'once'.
   *
   * @param studyName Name of the study
   * @param pseudonym Pseudonym of the participant
   * @param identifier ID or a questionnaires custom name the instance is related to
   * @param questionnaire Questionnaire fields to patch
   */
  @SuccessResponse(StatusCodes.OK, 'Patch successful')
  @Example<PatchQuestionnaireInstanceResponseDto>({
    status: 'released',
    progress: 49,
    releaseVersion: 1,
  })
  @Response<StudyNotFoundError>(StatusCodes.NOT_FOUND, 'Study does not exist')
  @Response<QuestionnaireInstanceNotFoundError>(
    StatusCodes.NOT_FOUND,
    'Questionnaire instance was not found'
  )
  @Response<InvalidQuestionnaireCycleUnitError>(
    StatusCodes.FORBIDDEN,
    'The questionnaires cycle unit does not guarantee selecting a single instance by custom name'
  )
  @Response<InvalidStatusTransitionError>(
    StatusCodes.BAD_REQUEST,
    'Requested status transition is not allowed'
  )
  @Response<ReleaseNeedsAnswersError>(
    StatusCodes.PRECONDITION_FAILED,
    'There are no new answers to release'
  )
  @Response<Error>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An internal error occurred'
  )
  @Security(publicApiSecurity)
  @Patch('{identifier}')
  public async patchQuestionnaireInstance(
    @Path() studyName: StudyName,
    @Path() pseudonym: Pseudonym,
    @Path() identifier: QuestionnaireInstanceIdentifier,
    @Body() questionnaire: PatchQuestionnaireInstanceRequestDto
  ): Promise<PatchQuestionnaireInstanceResponseDto> {
    try {
      return await QuestionnaireFacade.patchInstance(
        identifier,
        studyName,
        pseudonym,
        questionnaire
      );
    } catch (e: unknown) {
      if (e instanceof InvalidStatusTransitionError) {
        throw this.createBoom(e, StatusCodes.BAD_REQUEST);
      } else if (e instanceof ReleaseNeedsAnswersError) {
        throw this.createBoom(e, StatusCodes.PRECONDITION_FAILED);
      }
      this.handleCommonErrors(e);
      this.internalServerError(e);
    }
  }

  /**
   * Add or update answers for a questionnaire instance by ID or a custom name.
   * Using a custom name as an identifier is only supported for questionnaires with a cycle unit of 'once'.
   *
   * If any base64 encoded files were included in the posted answers, only the provided filenames will be included in the response. The property `file` will be an empty string.
   *
   * @param studyName Name of the study
   * @param pseudonym Pseudonym of the participant
   * @param identifier ID or a questionnaires custom name the instance is related to
   * @param answers A complete list of answers to post
   */
  @SuccessResponse(StatusCodes.OK, 'Post successful')
  @Example<PostAnswerResponseDto[]>([
    {
      answerOptionVariableName: 'answer_option_a',
      questionVariableName: 'aquestion_a',
      type: 'MultiSelect',
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      value: [3, 5, 7],
      version: 1,
      dateOfRelease: '2024-02-06T12:12:12000',
    },
  ])
  @Response<StudyNotFoundError>(StatusCodes.NOT_FOUND, 'Study does not exist')
  @Response<QuestionnaireInstanceNotFoundError>(
    StatusCodes.NOT_FOUND,
    'Questionnaire instance was not found'
  )
  @Response<InvalidQuestionnaireCycleUnitError>(
    StatusCodes.FORBIDDEN,
    'The questionnaires cycle unit does not guarantee selecting a single instance by custom name'
  )
  @Response<CouldNotCreateOrUpdateAnswersError>(
    StatusCodes.UNPROCESSABLE_ENTITY,
    'The given answers could not be created or updated'
  )
  @Response<Error>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An internal error occurred'
  )
  @Security(publicApiSecurity)
  @Tags('Answers')
  @Post('{identifier}/answers')
  public async postQuestionnaireInstanceAnswers(
    @Path() studyName: StudyName,
    @Path() pseudonym: Pseudonym,
    @Path() identifier: QuestionnaireInstanceIdentifier,
    @Body() answers: PostAnswerRequestDto[]
  ): Promise<PostAnswerResponseDto[]> {
    if (answers.length === 0) {
      throw this.createEmptyAnswersError();
    }

    try {
      return await QuestionnaireFacade.postAnswers(
        studyName,
        pseudonym,
        identifier,
        answers
      );
    } catch (e: unknown) {
      if (e instanceof CouldNotCreateOrUpdateAnswersError) {
        throw this.createBoom(e, StatusCodes.UNPROCESSABLE_ENTITY);
      } else if (e instanceof SampleTrackingServiceRejectedSampleIdError) {
        throw this.createBoom(e, StatusCodes.UNPROCESSABLE_ENTITY);
      } else if (e instanceof InvalidStatusTransitionError) {
        throw this.createBoom(e, StatusCodes.BAD_REQUEST);
      } else if (e instanceof InvalidAnswersError) {
        throw this.createBoom(e, StatusCodes.PRECONDITION_FAILED);
      } else if (e instanceof QuestionOrAnswerOptionNotFoundError) {
        throw this.createBoom(e, StatusCodes.PRECONDITION_FAILED);
      }
      this.handleCommonErrors(e);
      this.internalServerError(e);
    }
  }

  private createEmptyAnswersError(): ValidateError {
    return new ValidateError(
      {
        answersDto: {
          message: 'no answers provided',
          value: '[]',
        },
      },
      ''
    );
  }

  private createBoom(exception: Error, statusCode: StatusCodes): Boom<unknown> {
    return new Boom(exception.message, { statusCode });
  }

  private handleCommonErrors(e: unknown): never | void {
    if (e instanceof QuestionnaireInstanceNotFoundError) {
      throw this.createBoom(e, StatusCodes.NOT_FOUND);
    } else if (e instanceof StudyNotFoundError) {
      throw this.createBoom(e, StatusCodes.NOT_FOUND);
    } else if (e instanceof InvalidQuestionnaireCycleUnitError) {
      throw this.createBoom(e, StatusCodes.FORBIDDEN);
    }
  }

  private internalServerError(e: unknown): never {
    console.error('ERROR', e);
    throw this.createBoom(
      new Error('An unknown error occurred'),
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
