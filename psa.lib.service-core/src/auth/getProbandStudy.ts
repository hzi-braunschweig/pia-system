/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken } from './authModel';
import { SpecificError } from '../plugins/errorHandler';
import { StatusCodes } from 'http-status-codes';

export class ProbandStudyError extends SpecificError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errorCode = 'PROBAND_STUDY_ERROR';
}

export function getProbandStudy(decodedToken: AccessToken): string {
  if (decodedToken.studies.length !== 1 || !decodedToken.studies[0]) {
    throw new ProbandStudyError();
  }
  return decodedToken.studies[0];
}
