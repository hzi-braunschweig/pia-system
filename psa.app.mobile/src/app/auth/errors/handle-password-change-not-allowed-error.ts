/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class HandlePasswordChangeNotAllowedError extends Error {
  constructor(
    message: string = 'Authserver logins do not allow for the application to handle password changes'
  ) {
    super(message);
  }
}
