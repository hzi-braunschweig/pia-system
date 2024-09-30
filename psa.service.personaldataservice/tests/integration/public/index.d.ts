/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare namespace Chai {
  interface Assertion {
    failWithInvalidToken(): Assertion;

    failWithNoStudyAccessFor(studyName: string): Assertion;

    failWithStudyNotFound(studyName: string): Assertion;

    failWithError(error: {
      statusCode: number;
      message?: string;
      errorCode?: string;
    }): Assertion;

    failWithInvalidPayload(andInclude: string): Assertion;
  }
}
