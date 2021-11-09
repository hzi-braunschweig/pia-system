/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import mail, { Transporter } from 'nodemailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { Options } from 'nodemailer/lib/mailer';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { MailserverConnection } from '../config/configModel';

export interface MailContent {
  subject: string;
  text: string;
  html?: string;
}

export class MailService {
  private static readonly SMTP_OVER_SSL_PORT = 465;
  private static mailTransporter: Transporter<SentMessageInfo> | null;

  public static initService(mailServerConfig: MailserverConnection): void {
    let secure = false;
    if (mailServerConfig.port === MailService.SMTP_OVER_SSL_PORT) {
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

  public static async sendMail(
    recipient: string,
    email: MailContent
  ): Promise<boolean> {
    if (!MailService.mailTransporter) {
      throw new Error('MailService was not initialized');
    }
    const mailOptions: Options = {
      to: recipient,
      subject: email.subject,
      text: email.text,
      html: email.html ? sanitizeHtml(email.html) : undefined,
    };

    const result = await MailService.mailTransporter.sendMail(mailOptions);
    return result.accepted.includes(recipient);
  }
}
