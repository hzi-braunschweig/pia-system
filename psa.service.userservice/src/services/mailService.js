/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const mail = require('nodemailer');
const { sanitizeHtml } = require('@pia/lib-service-core');

const { config } = require('../config');

/**
 * @description helper functions for sending mails via smtp mail server
 */

const mailService = (function () {
  let mailTransporter = null;

  function initService() {
    const mailServerConfig = config.servers.mailserver;
    let secure = false;
    if (mailServerConfig.port === 465) {
      secure = true;
    }
    console.log(
      `Using ${mailServerConfig.host}:${mailServerConfig.port} as smtp Server, secure: ${secure}, requireTLS: ${mailServerConfig.requireTLS}`
    );
    mailTransporter = mail.createTransport(
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
        tags: ['api'],
        secure: secure,
        requireTLS: mailServerConfig.requireTLS,
      },
      {
        from: `"${mailServerConfig.name}" <${mailServerConfig.from}>`,
      }
    );
  }

  function sendMail(recipient, email) {
    const mailOptions = {
      to: recipient,
      subject: email.subject,
      text: email.text,
      html: sanitizeHtml(email.html),
    };

    return mailTransporter.sendMail(mailOptions);
  }

  return {
    /**
     * @function
     * @description initializes the mail server connection
     * @memberof module:mailService
     */
    initService: initService,

    /**
     * @function
     * @description initializes the mail server connection
     * @param {string} recipient the email address of the recipient
     * @param {string} subject the email subject
     * @param {string} text the email text
     * @memberof module:mailService
     */
    sendMail: sendMail,
  };
})();

module.exports = mailService;
