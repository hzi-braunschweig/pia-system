/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface DataBaseError {
  readonly driverError: {
    readonly code: string;
  };
}

const isDataBaseError = (err: unknown): err is DataBaseError =>
  err instanceof Error && 'driverError' in err;

/**
 * Checks whether the error is a DataBaseError with given error code
 *
 * @param err any error
 * @param code postgres specific error code @see https://www.postgresql.org/docs/10/errcodes-appendix.html
 */
const isDataBaseErrorWithCode = (err: unknown, code: string): boolean =>
  isDataBaseError(err) && err.driverError.code === code;

export const isForeignKeyError = (err: unknown): boolean =>
  isDataBaseErrorWithCode(err, '23503');

export const isUniqueKeyError = (err: unknown): boolean =>
  isDataBaseErrorWithCode(err, '23505');
