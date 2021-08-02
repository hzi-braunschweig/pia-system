/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');

const mailService = require('../services/mailService.js');
const userserviceClient = require('../clients/userserviceClient');
const personaldataserviceClient = require('../clients/personaldataserviceClient');

class EmailInteractor {
  /**
   *
   * @param decodedToken {AccessToken} the jwt of the request
   * @param payload {EmailRequest}
   * @returns {Promise<Boom<unknown>|string[]>} list of mails which were successfully sent
   */
  static async sendEmailToProbands(decodedToken, payload) {
    if (decodedToken.role !== 'ProbandenManager') {
      return Boom.forbidden(
        `${decodedToken.role} is not allowed to send E-Mails`
      );
    }
    if (
      !(await this.hasUserAccessToAllProbands(
        decodedToken.username,
        payload.recipients
      ))
    ) {
      return Boom.forbidden(`Access to proband's personal data not allowed`);
    }

    const successfullySendTo = [];

    for (const pseudonym of payload.recipients) {
      const sentTo = await this.sendMailToProband(
        pseudonym,
        payload.title,
        payload.body
      );
      if (sentTo) {
        successfullySendTo.push(sentTo);
      }
    }
    if (!successfullySendTo.length) {
      return Boom.notFound('No mails were sent');
    }

    return successfullySendTo;
  }

  /**
   * Checks whether the user has access to all probands
   * @private
   * @param username {string} requesting user
   * @param recipients {string[]} list of proband's pseudonyms
   * @returns {Promise<boolean>} returns true if user has access to all probands
   */
  static async hasUserAccessToAllProbands(username, recipients) {
    const probandsWithAccessTo =
      await userserviceClient.getProbandsWithAccessToFromProfessional(username);
    return recipients.every((pseudonym) =>
      probandsWithAccessTo.includes(pseudonym)
    );
  }

  /**
   * Send a mail to a single proband by its pseudonym
   * @private
   * @param pseudonym {string}
   * @param subject {string}
   * @param text {string}
   * @returns {Promise<null|string>} E-Mail address if mail was sent, null otherwise
   */
  static async sendMailToProband(pseudonym, subject, text) {
    try {
      const recipientMail =
        await personaldataserviceClient.getPersonalDataEmail(pseudonym);
      if (!recipientMail) {
        return null;
      }
      const res = await mailService.sendMail(recipientMail, { subject, text });
      return res.accepted[0];
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

module.exports = EmailInteractor;
