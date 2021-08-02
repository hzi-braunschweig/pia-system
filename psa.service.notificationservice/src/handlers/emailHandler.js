/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const emailInteractor = require('../interactors/emailInteractor.js');

/**
 * @description hapi handler for sending emails
 */
class EmailHandler {
  /**
   * Sends given payload to multiple probands' via mail
   * @param {import('@hapi/hapi').Request} request
   * @returns {Promise<Boom<Joi.ObjectSchema.unknown>|string[]>}
   */
  static sendEmail(request) {
    return emailInteractor.sendEmailToProbands(
      request.auth.credentials,
      request.payload
    );
  }
}

module.exports = EmailHandler;
