/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';

export class EventHistoryIsDisabledError extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = 'EVENT_HISTORY_IS_DISABLED';
}

export class ClientHasNoAccessToStudyError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'CLIENT_HAS_NO_ACCESS_TO_STUDY';
}
