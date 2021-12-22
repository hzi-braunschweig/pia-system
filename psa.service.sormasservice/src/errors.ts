/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

abstract class ErrorWithCausedBy extends Error {
  public constructor(
    message?: string,
    protected readonly causedBy?: Error | unknown
  ) {
    super(message);
  }
}

export class SormasFetchPersonError extends ErrorWithCausedBy {}
export class FetchProbandError extends ErrorWithCausedBy {}
export class ProbandNotFoundError extends ErrorWithCausedBy {}
export class UpdatePersonalDataError extends ErrorWithCausedBy {}
export class UpdateFollowUpError extends ErrorWithCausedBy {}
