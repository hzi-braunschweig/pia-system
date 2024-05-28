/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';

export class ApiClientNotFoundError extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = 'API_CLIENT_NOT_FOUND';
}

export class ApiClientAlreadyExistsError extends SpecificError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly errorCode = 'API_CLIENT_ALREADY_EXISTS';
}
