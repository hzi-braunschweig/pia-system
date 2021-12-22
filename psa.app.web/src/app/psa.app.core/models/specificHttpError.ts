/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';

export interface SpecificHttpError {
  error: {
    error: string;
    errorCode: string;
    message: string;
    statusCode: number;
  };
}

export function isSpecificHttpError(
  err: unknown
): err is HttpErrorResponse & SpecificHttpError {
  if (!(err instanceof HttpErrorResponse)) {
    return false;
  }
  return (
    typeof err.error.error === 'string' &&
    typeof err.error.errorCode === 'string' &&
    typeof err.error.message === 'string' &&
    typeof err.error.statusCode === 'number'
  );
}
