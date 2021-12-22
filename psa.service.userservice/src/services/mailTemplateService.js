/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { config } = require('../config');

/**
 * Representation of a mail
 * @typedef {Object} MailContent
 * @property {string} subject - Mail subject
 * @property {string} text - Mail content as text
 * @property {string} html - Mail content as html
 */

const mailTemplateService = (function () {
  const webAppLink = config.webappUrl;

  function createRegistrationMail(password, role) {
    return {
      subject: 'Ein PIA Account wurde für Sie erstellt',
      text:
        'Soeben wurde für Sie ein Account für die Nutzung von PIA erstellt\n\n' +
        'Ihre Rolle: ' +
        role +
        '\nIhr Passwort: ' +
        password +
        '\n\nSie können sich unter "' +
        webAppLink +
        '" mit Ihrer Email-Adresse und dem obigen Passwort anmelden.\n\n' +
        'Viel Spaß!',
      html:
        'Soeben wurde für Sie ein Account für die Nutzung von PIA erstellt<br><br>' +
        'Ihre Rolle: ' +
        role +
        '<br>Ihr Passwort: ' +
        password +
        '<br><br>Sie können sich unter <a href="' +
        webAppLink +
        '">PIA Webapp</a> mit Ihrer Email-Adresse und dem obigen Passwort anmelden.<br><br>' +
        'Viel Spaß!',
    };
  }

  return {
    /**
     * Creates a registration mail for professional roles
     * @returns {MailContent}
     */
    createRegistrationMail: createRegistrationMail,
  };
})();

module.exports = mailTemplateService;
