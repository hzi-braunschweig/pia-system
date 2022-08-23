/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface EmailRequest {
  recipients: string[];
  title: string;
  body: string;
}

export interface EmailRecipient {
  pseudonym: string;
  email: string;
}
