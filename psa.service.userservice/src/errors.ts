/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ErrorWithCausedBy, SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';
import { FieldErrors } from 'tsoa';
import { Boom } from '@hapi/boom';

export class EntityNotFoundError extends Error {}

export class PlannedProbandNotFoundError extends ErrorWithCausedBy {}
export class StudyNotFoundError extends ErrorWithCausedBy {}
export class AccountCreateError extends ErrorWithCausedBy {}
export class ProbandSaveError extends ErrorWithCausedBy {}
export class ParticipantDeleteError extends ErrorWithCausedBy {}
export class ParticipantSaveError extends ErrorWithCausedBy {}
export class PseudonymAlreadyExistsError extends ErrorWithCausedBy {}
export class IdsAlreadyExistsError extends ErrorWithCausedBy {}
export class ParticipantNotFoundError extends ErrorWithCausedBy {}
export class UnknownRole extends ErrorWithCausedBy {}
export class CannotGeneratePseudonymError extends ErrorWithCausedBy {}
export class CannotUpdateAuthserverUsername extends ErrorWithCausedBy {}
export class AccountLogoutError extends ErrorWithCausedBy {}
export class CouldNotCreateNewRandomPseudonymError extends ErrorWithCausedBy {}

export class MissingPermissionError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'MISSING_PERMISSION';
}

export class FourEyeOppositionPartnerNotFoundError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = '4_EYE_OPPOSITION.REQUESTED_FOR_NOT_FOUND';
}
export class FourEyeOppositionSelfNotAllowedAsPartnerError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = '4_EYE_OPPOSITION.SELF_NOT_ALLOWED_AS_PARTNER';
}
export class FourEyeOppositionPartnerLacksPermissionError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = '4_EYE_OPPOSITION.PARTNER_LACKS_PERMISSION';
}
export class FourEyeOppositionPendingChangeAlreadyExistsError extends SpecificError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly errorCode = '4_EYE_OPPOSITION.PENDING_CHANGE_ALREADY_EXISTS';
}

export class StudyInvalidPsyeudonymPrefixError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = 'STUDY.INVALID_PSEUDONYM_PREFIX';
}

export class AccountNotFound extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = 'ACCOUNT.NOT_FOUND';
}
export class AccountAlreadyExistsError extends SpecificError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly errorCode = 'ACCOUNT.ALREADY_EXISTS';
}

export class PublicApiValidationError {
  public static asBoom(fields: FieldErrors): Boom {
    return new Boom<FieldErrors>(this.getMessage(fields), {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      data: fields,
    });
  }

  private static getMessage(fields: FieldErrors): string {
    return (
      'Payload is invalid:\n' +
      Object.entries(fields)
        .map(
          ([fieldName, field]) =>
            `${fieldName}: ${String(field.value)} --> ${field.message}`
        )
        .join('\n')
    );
  }
}
