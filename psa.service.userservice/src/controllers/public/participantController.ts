/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Body,
  Controller,
  Delete,
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
  CreateParticipantRequestDto,
  CreateParticipantResponseDto,
  ParticipantDeletionType,
  ParticipantDto,
  ParticipantStatus,
  PatchParticipantRequestDto,
} from '../../models/participant';
import { StatusCodes } from 'http-status-codes';
import { EntityNotFoundError } from 'typeorm';
import {
  ProbandDataPatch,
  ProbandDto,
  ProbandOrigin,
} from '../../models/proband';
import {
  AccountCreateError,
  ParticipantSaveError,
  ParticipantNotFoundError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
} from '../../errors';
import { ProbandService } from '../../services/probandService';
import { Boom } from '@hapi/boom';
import { publicApiSecurity } from '@pia/lib-service-core';
import { Pseudonym } from '@pia/lib-publicapi';

@Route('public/studies/{studyName}/participants')
@Tags('Participants')
export class ParticipantController extends Controller {
  /**
   * Returns all participants of given study
   * @param studyName the name of the study
   */
  @Security(publicApiSecurity)
  @Get()
  public async getParticipants(
    @Path() studyName: string
  ): Promise<ParticipantDto[]> {
    try {
      return (await ProbandService.getAllProbandsOfStudy(studyName)).map(
        (participant) => this.mapProbandToParticipant(participant)
      );
    } catch (error) {
      console.error(error);
      this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      throw this.getError('An unknown error occurred');
    }
  }

  /**
   * Returns the participant with given pseudonym
   * @param studyName the name of the study
   * @param pseudonym the pseudonym of the participant
   */
  @Security(publicApiSecurity)
  @Response<ParticipantNotFoundError>(
    StatusCodes.NOT_FOUND,
    'The participant with the given pseudonym does not exist'
  )
  @Get('{pseudonym}')
  public async getParticipant(
    @Path() studyName: string,
    @Path() pseudonym: Pseudonym
  ): Promise<ParticipantDto> {
    try {
      return this.mapProbandToParticipant(
        await ProbandService.getProbandByPseudonymOrFail(pseudonym, [studyName])
      );
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        this.setStatus(StatusCodes.NOT_FOUND);
        throw this.getError(
          'The participant with the given pseudonym does not exist'
        );
      } else {
        console.error(error);
        this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        throw this.getError('An unknown error occurred');
      }
    }
  }

  /**
   * Creates a new participant
   * @param studyName
   * @param participant
   */
  @Security(publicApiSecurity)
  @Response<StudyNotFoundError>(StatusCodes.NOT_FOUND, 'Study does not exist')
  @Response<PseudonymAlreadyExistsError>(
    StatusCodes.CONFLICT,
    'The pseudonym is already in use'
  )
  @Response<AccountCreateError>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An error occurred while trying to create the account'
  )
  @Response<ParticipantSaveError>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An error occurred while trying to save the participant'
  )
  @SuccessResponse(StatusCodes.CREATED, 'Created')
  @Post()
  public async postParticipant(
    @Path() studyName: string,
    @Body() participant: CreateParticipantRequestDto
  ): Promise<CreateParticipantResponseDto> {
    try {
      const response = await ProbandService.createProbandWithAccount(
        studyName,
        {
          ...participant,
          origin: ProbandOrigin.PUBLIC_API,
        },
        false,
        true
      );
      this.setStatus(StatusCodes.CREATED);
      return response;
    } catch (err) {
      let error =
        err instanceof Error ? err : new Error('An unknown error occurred');

      if (error instanceof StudyNotFoundError) {
        this.setStatus(StatusCodes.NOT_FOUND);
      } else if (error instanceof PseudonymAlreadyExistsError) {
        this.setStatus(StatusCodes.CONFLICT);
      } else if (error instanceof AccountCreateError) {
        this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      } else if (error instanceof ProbandSaveError) {
        this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        error = new ParticipantSaveError(
          'An error occurred while trying to save the participant',
          error.causedBy
        );
      } else {
        console.error(error);
        this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      }
      throw this.getError(error.message);
    }
  }

  /**
   * Allows to update certain fields of a participant
   * @param studyName
   * @param pseudonym
   * @param participantPatch
   */
  @Security(publicApiSecurity)
  @Patch('{pseudonym}')
  public async patchParticipant(
    @Path() studyName: string,
    @Path() pseudonym: Pseudonym,
    @Body() participantPatch: PatchParticipantRequestDto
  ): Promise<ParticipantDto> {
    try {
      return this.mapProbandToParticipant(
        await ProbandService.updateProband(
          pseudonym,
          [studyName],
          this.mapParticipantPatchToProbandPatch(participantPatch)
        )
      );
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        this.setStatus(StatusCodes.NOT_FOUND);
        throw this.getError(
          'The participant with the given pseudonym does not exist'
        );
      } else {
        console.error(error);
        this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        throw this.getError('An unknown error occurred');
      }
    }
  }

  /**
   * Deletes a participant and all its data
   *
   * Should be used in case of a participant's total opposition.
   *
   * @param studyName
   * @param pseudonym
   * @param deletionType
   */
  @Security(publicApiSecurity)
  @Response<ParticipantNotFoundError>(
    StatusCodes.NOT_FOUND,
    'The participant with the given pseudonym does not exist'
  )
  @SuccessResponse(StatusCodes.NO_CONTENT, 'No Content')
  @Delete('{pseudonym}')
  public async deleteParticipant(
    @Path() studyName: string,
    @Path() pseudonym: Pseudonym,
    @Query()
    deletionType: ParticipantDeletionType = ParticipantDeletionType.DEFAULT
  ): Promise<void> {
    try {
      await ProbandService.getProbandByPseudonymOrFail(pseudonym, [studyName]);
      await ProbandService.delete(pseudonym, deletionType);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        this.setStatus(StatusCodes.NOT_FOUND);
        throw this.getError(
          'The participant with the given pseudonym does not exist'
        );
      } else {
        console.error(error);
        this.setStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        throw this.getError('An unknown error occurred');
      }
    }
  }

  private mapProbandToParticipant(proband: ProbandDto): ParticipantDto {
    return {
      pseudonym: proband.pseudonym,
      ids: proband.ids,
      study: proband.study,
      status: proband.status as unknown as ParticipantStatus,
      accountStatus: proband.accountStatus,
      studyCenter: proband.studyCenter,
      examinationWave: proband.examinationWave,
      firstLoggedInAt: proband.firstLoggedInAt,
      deactivatedAt: proband.deactivatedAt,
      deletedAt: proband.deletedAt,
      isTestParticipant: proband.isTestProband,
    };
  }

  private mapParticipantPatchToProbandPatch(
    participantPatch: PatchParticipantRequestDto
  ): ProbandDataPatch {
    const probandPatch = {
      ...participantPatch,
      ...('isTestParticipant' in participantPatch
        ? { isTestProband: participantPatch.isTestParticipant }
        : {}),
    };
    delete probandPatch.isTestParticipant;
    return probandPatch;
  }

  private getError(message: string): Boom {
    return new Boom(message, { statusCode: this.getStatus() });
  }
}
