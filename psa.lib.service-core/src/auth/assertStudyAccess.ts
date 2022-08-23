/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken } from './authModel';
import { SpecificError } from '../plugins/errorHandler';
import { StatusCodes } from 'http-status-codes';
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
  decodedToken: AccessToken
): void {
  if (
    !hasRealmRole('SysAdmin', decodedToken) &&
    !decodedToken.studies.includes(expectedStudyName)
  ) {
    throw new MissingStudyAccessError(
      `Requesting user has no access to study "${expectedStudyName}"`
    );
  }
}
