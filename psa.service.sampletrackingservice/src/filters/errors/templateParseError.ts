/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class TemplateParseError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'TemplateParseError';
  }
}