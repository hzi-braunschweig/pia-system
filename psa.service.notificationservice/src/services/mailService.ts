/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as mail from 'nodemailer';
import { sanitizeHtml } from '@pia/lib-service-core';

import { config } from '../config';
import { assert } from 'ts-essentials';

/**
 * @description helper functions for sending mails via smtp mail server
 */

export class MailService {
  private static mailTransporter: null | mail.Transporter = null;

  /**
   * @function
   * @description initializes the mail server connection
   * @memberof module:mailService
   */
  public static initService(): void {
    const smtpsPort = 465;
    const mailServerConfig = config.servers.mailserver;
    let secure = false;
    if (mailServerConfig.port === smtpsPort) {
      secure = true;
    }
    console.log(
      `Using ${mailServerConfig.host}:${
        mailServerConfig.port
      } as smtp Server, ${secure ? 'secure' : 'NOT secure'}, ${
        mailServerConfig.requireTLS ? 'requireTLS' : 'DONT requireTLS'
      }`
    );
    MailService.mailTransporter = mail.createTransport(
      {
        host: mailServerConfig.host,
        port: mailServerConfig.port,
        auth:
          mailServerConfig.user || mailServerConfig.password
            ? {
                user: mailServerConfig.user,
                pass: mailServerConfig.password,
              }
            : undefined,
        secure: secure,
        requireTLS: mailServerConfig.requireTLS,
      },
      {
        from: `"${mailServerConfig.name}" <${mailServerConfig.from}>`,
      }
    );
  }

  /**
   * @function
   * @description initializes the mail server connection
   * @param {string} recipient the email address of the recipient
   * @param {string} subject the email subject
   * @param {string} text the email text
   * @memberof module:mailService
   */
  public static async sendMail(
    recipient: string,
    email: { subject: string; text: string; html?: string }
  ): Promise<{ accepted?: string[] }> {
    const mailOptions = {
      to: recipient,
      subject: email.subject,
      text: email.text,
      html: email.html ? sanitizeHtml(email.html) : undefined,
    };

    assert(MailService.mailTransporter);
    return (await MailService.mailTransporter.sendMail(mailOptions)) as {
      accepted?: string[];
    };
  }
}
