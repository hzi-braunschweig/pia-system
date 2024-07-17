/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FirebaseError } from 'firebase-admin';

export class FirebaseMessageError extends Error {
  public readonly originalError: FirebaseError;

  public constructor(error: FirebaseError) {
    super(error.message);
    this.name = error.code;
    this.originalError = error;
  }
}

export class FirebaseMessageRejectedError extends FirebaseMessageError {}

export class FirebaseMessageUnknownError extends FirebaseMessageError {}
