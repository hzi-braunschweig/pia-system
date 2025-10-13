/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthCredentials } from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';
import { SpecificError } from '../plugins/errorHandler';
import { hasRealmRole } from './realmRole';
export class MissingStudyAccessError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'MISSING_STUDY_ACCESS';
}

/**
 * Used to check whether a user has access to a certain study
 */
export function assertStudyAccess(
  expectedStudyName: string,
  credentials: Record<string, unknown> & AuthCredentials
): void {
  if (hasRealmRole('SysAdmin', credentials)) {
    return;
  }
  if (
    hasStudiesAttribute(credentials) &&
    credentials.studies.includes(expectedStudyName)
  ) {
    return;
  }
  throw new MissingStudyAccessError(
    `Requesting user has no access to study "${expectedStudyName}"`
  );
}

function hasStudiesAttribute(
  decodedToken: Record<string, unknown>
): decodedToken is { studies: string[] } {
  return (
    'studies' in decodedToken &&
    Array.isArray(decodedToken['studies']) &&
    decodedToken['studies'].every((x) => typeof x === 'string')
  );
}
