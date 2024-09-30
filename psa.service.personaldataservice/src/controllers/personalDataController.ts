/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Boom } from '@hapi/boom';
import { Pseudonym, StudyName } from '@pia/lib-publicapi';
import {
  InvalidAuthorizationTokenError,
  MissingStudyAccessError,
  SpecificError,
  publicApiSecurity,
} from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';
import {
  Body,
  Controller,
  Patch,
  Path,
  Route,
  Security,
  Tags,
  SuccessResponse,
  Example,
  Response,
} from 'tsoa';
import {
  PersonalDataPatchRequestDto,
  PersonalDataPatchResponseDto,
} from './dtos/personalDataRequestDto';
import { PersonalDataFacade } from '../services/personalDataFacade';
import {
  StudyNotFoundError,
  ParticipantNotFoundError,
  ParticipantRefusesContactError,
} from '../errors';

@Route('public/studies/{studyName}/participants/{pseudonym}/personal-data')
@Tags('Personal Data')
export class PersonalDataController extends Controller {
  /**
   * Updates personal data of a participant
   * @param studyName Name of the study
   * @param pseudonym Pseudonym of the participant
   * @param personalData Personal data to update
   */
  @SuccessResponse(StatusCodes.OK)
  @Example<PersonalDataPatchRequestDto[]>([
    {
      salutation: 'Ms.',
      title: 'Dr.',
      firstname: 'Jane',
      lastname: 'Doe',
      address: {
        street: 'Street',
        houseNumber: '1',
        postalCode: '12345',
        city: 'City',
        state: 'State',
      },
      phone: {
        private: '123456789',
        work: '987654321',
        mobile: '123123123',
      },
      email: 'some-email@local.host',
      comment: 'Some comment',
    },
  ])
  @Example<PersonalDataPatchRequestDto[]>([
    {
      email: 'jane.doe@local.host',
      comment: 'This is a comment',
      phone: {
        mobile: '+49123456789',
      },
    },
  ])
  @Response<SpecificError>(StatusCodes.NOT_FOUND, 'Not found', {
    name: 'StudyNotFoundError',
    message: 'Study "Study Name" does not exist',
    errorCode: 'STUDY_NOT_FOUND',
    statusCode: StatusCodes.NOT_FOUND,
  } as StudyNotFoundError)
  @Response<SpecificError>(StatusCodes.NOT_FOUND, 'Not found', {
    name: 'ParticipantNotFoundError',
    message: 'Participant with pseudonym "studyname-001" does not exist.',
    errorCode: 'PARTICIPANT_NOT_FOUND',
    statusCode: StatusCodes.NOT_FOUND,
  } as ParticipantNotFoundError)
  @Response<SpecificError>(StatusCodes.FORBIDDEN, 'Forbidden', {
    name: 'ParticipantRefusesContactError',
    message: 'Participant has refused to be contacted',
    errorCode: 'PARTICIPANT_REFUSES_CONTACT',
    statusCode: StatusCodes.FORBIDDEN,
  } as ParticipantRefusesContactError)
  @Response<InvalidAuthorizationTokenError>(
    StatusCodes.UNAUTHORIZED,
    'Unauthorized'
  )
  @Response<MissingStudyAccessError>(StatusCodes.FORBIDDEN, 'Forbidden')
  @Response<Error>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An internal error occurred',
    {
      name: 'Error',
      message: 'An internal error occurred',
    }
  )
  @Security(publicApiSecurity)
  @Patch('')
  public async patchPersonalData(
    @Path() studyName: StudyName,
    @Path() pseudonym: Pseudonym,
    @Body() personalData: PersonalDataPatchRequestDto
  ): Promise<PersonalDataPatchResponseDto> {
    try {
      return await PersonalDataFacade.patchPersonalData(
        studyName,
        pseudonym,
        personalData
      );
    } catch (e: unknown) {
      this.handleErrors(e);
    }
  }

  private handleErrors(e: unknown): never {
    if (e instanceof SpecificError) {
      throw e;
    }

    console.error('ERROR', e);
    throw this.createBoom(
      new Error('An unknown error occurred'),
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  private createBoom(exception: Error, statusCode: StatusCodes): Boom<unknown> {
    return new Boom(exception.message, { statusCode });
  }
}
