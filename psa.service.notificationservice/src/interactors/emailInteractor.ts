/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { MailService, AccessToken, asyncMap } from '@pia/lib-service-core';
import { userserviceClient } from '../clients/userserviceClient';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import { EmailRecipient, EmailRequest } from '../models/email';

export class EmailInteractor {
  /**
   *
   * @param decodedToken the jwt of the request
   * @param payload
   * @returns list of mails which were successfully sent
   */
  public static async sendEmailToProbands(
    decodedToken: AccessToken,
    payload: EmailRequest
  ): Promise<EmailRecipient[]> {
    if (
      !(await this.hasUserAccessToAllProbands(
        decodedToken.username,
        payload.recipients
      ))
    ) {
      throw Boom.forbidden(`Access to proband's personal data not allowed`);
    }

    return (
      await asyncMap(
        payload.recipients,
        async (pseudonym) =>
          await this.sendMailToProband(pseudonym, payload.title, payload.body)
      )
    ).filter((sentTo) => sentTo !== null) as EmailRecipient[];
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
  public static async sendMailToProband(
    pseudonym: string,
    subject: string,
    text: string
  ): Promise<EmailRecipient | null> {
    try {
      const email = await personaldataserviceClient.getPersonalDataEmail(
        pseudonym
      );
      if (!email) {
        return null;
      }
      const success = await MailService.sendMail(email, {
        subject,
        text,
      });
      return success ? { pseudonym, email } : null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
