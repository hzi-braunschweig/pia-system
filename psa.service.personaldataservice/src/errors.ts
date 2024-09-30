/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';
import { Pseudonym } from '@pia/lib-publicapi';

export class ParticipantRefusesContactError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'PARTICIPANT_REFUSES_CONTACT';
  public readonly message = 'Participant has refused to be contacted';
}

export class ParticipantNotFoundError extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = 'PARTICIPANT_NOT_FOUND';

  public constructor(pseudonym: Pseudonym) {
    super(`Participant with pseudonym "${pseudonym}" does not exist`);
  }
}

export class StudyNotFoundError extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = 'STUDY_NOT_FOUND';

  public constructor(studyName: string) {
    super(`Study "${studyName}" does not exist`);
  }
}
