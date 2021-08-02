/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

class TemplateParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TemplateParseError';
  }
}

module.exports = TemplateParseError;
