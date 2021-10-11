/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

abstract class ErrorWithCausedBy extends Error {
  public constructor(message?: string, protected readonly causedBy?: Error) {
    super(message);
  }
}

export class WrongRoleError extends ErrorWithCausedBy {}
export class NoAccessToStudyError extends ErrorWithCausedBy {}

export class NoPlannedProbandFoundError extends ErrorWithCausedBy {}
export class ProbandAlreadyExistsError extends ErrorWithCausedBy {}
export class AccountCreateError extends ErrorWithCausedBy {}
export class ProbandSaveError extends ErrorWithCausedBy {}
