/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';

import { MailService } from '@pia/lib-service-core';
import { UserserviceClient } from '../clients/userserviceClient';
import { PersonaldataserviceClient } from '../clients/personaldataserviceClient';
import { AccessToken } from 'dist/src';
import { EmailRequest } from '../models/emailRequest';

export class EmailInteractor {
  /**
   *
   * @param decodedToken {AccessToken} the jwt of the request
   * @param payload {EmailRequest}
   * @returns {Promise<Boom<unknown>|string[]>} list of mails which were successfully sent
   */
  public static async sendEmailToProbands(
    decodedToken: AccessToken,
    payload: EmailRequest
  ): Promise<Boom.Boom | string[]> {
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
  public static async hasUserAccessToAllProbands(
    username: string,
    recipients: string[]
  ): Promise<boolean> {
    const probandsWithAccessTo =
      await UserserviceClient.getProbandsWithAccessToFromProfessional(username);
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
  public static async sendMailToProband(
    pseudonym: string,
    subject: string,
    text: string
  ): Promise<string | null> {
    try {
      const recipientMail =
        await PersonaldataserviceClient.getPersonalDataEmail(pseudonym);
      if (!recipientMail) {
        return null;
      }
      const success = await MailService.sendMail(recipientMail, {
        subject,
        text,
      });
      return success ? recipientMail : null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

module.exports = EmailInteractor;
