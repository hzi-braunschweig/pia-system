/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class CannotDetermineDeletionTypeError extends Error {
  message =
    'Deletion type is not determinable without calling allowKeepStudyAnswers() or denyKeepStudyAnswers() first';
}
