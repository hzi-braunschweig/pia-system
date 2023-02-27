/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';

export class QuestionnaireInstanceNotFoundError extends Error {}
export class CouldNotCreateNewRandomVariableNameError extends Error {}
export class WrongRoleError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'WRONG_ROLE';
}
