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
  const appStoreLink =
    'https://apps.apple.com/de/app/pia-epidemiologie/id1510929221';
  const playStoreLink =
    'https://play.google.com/store/apps/details?id=de.pia.app';

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

  function createSormasRegistrationMail(password) {
    return {
      subject: 'Ihre Registrierung für das Symptomtagebuch',
      text: `Liebe Kontaktperson, 

schön, dass Sie das Symptomtagebuch SORMAS-SB nutzen möchten, um Ihrem Gesundheitsamt Ihren täglichen Gesundheitszustand mitzuteilen. 
Mit dieser E-Mail erhalten Sie das Erstpasswort, mit dem Sie sich in der App oder der Webanwendung anmelden können. Ihren Anmeldenamen (Buchstaben und 10 Ziffern) haben Sie am Telefon von Ihrer zuständigen Betreuungsperson im Gesundheitsamt bereits erhalten. Um das elektronische Symptomtagebuch nutzen zu können laden Sie die App “PIA Epidemiologie” aus dem App Store (${appStoreLink}) oder Play Store (${playStoreLink}) herunter. Alternativ können Sie die Webversion (${webAppLink}) nutzen. Melden Sie sich mit Ihrem Anmeldenamen und dem untenstehenden Passwort an. 

Erstpasswort (gültig für 120 Stunden): ${password}

Unter dem Link https://www.sormas-oegd.de/materialien finden Sie weitere Informationen zu SORMAS und SORMAS-SB. Wenn Sie etwas herunterscrollen, finden Sie unter der Überschrift “Symptomtagebücher” ein Infoblatt und unter der Überschrift “SORMAS SymptomtageBuch” das Teilnehmerhandbuch SORMAS-SB”

Wenn Sie technische Probleme haben, melden Sie sich bitte bei Ihrem Gesundheitsamt, Ihr Anliegen wird dann an die entsprechende Stelle weitergeleitet.

Bei gesundheitlichen Problemen oder Unsicherheiten wenden Sie sich bitte an Ihre*n Arzt/Ärztin oder das Gesundheitsamt. 

Vielen Dank und beste Wünsche für Ihre Gesundheit! 
Ihr SORMAS-SB Team.
      `,
      html:
        'Liebe Kontaktperson,<br><br>' +
        'schön, dass Sie das Symptomtagebuch SORMAS-SB nutzen möchten, um Ihrem Gesundheitsamt Ihren täglichen Gesundheitszustand mitzuteilen.<br><br>' +
        'Mit dieser E-Mail erhalten Sie das Erstpasswort, mit dem Sie sich in der App oder der Webanwendung anmelden können. ' +
        'Ihren Anmeldenamen (Buchstaben und 10 Ziffern) haben Sie am Telefon von Ihrer zuständigen Betreuungsperson im Gesundheitsamt bereits erhalten. ' +
        'Um das elektronische Symptomtagebuch nutzen zu können laden Sie die App “PIA Epidemiologie” aus dem ' +
        'App Store (' +
        appStoreLink +
        ') oder Play Store (' +
        playStoreLink +
        ') herunter. Alternativ können Sie die Webversion (' +
        webAppLink +
        ') nutzen. Melden Sie sich mit Ihrem Anmeldenamen und dem untenstehenden Passwort an.<br><br>' +
        'Erstpasswort (gültig für 120 Stunden): ' +
        password +
        '<br><br>' +
        'Unter dem Link https://www.sormas-oegd.de/materialien finden Sie weitere Informationen zu SORMAS und SORMAS-SB. Wenn Sie etwas herunterscrollen, ' +
        'finden Sie unter der Überschrift “Symptomtagebücher” ein Infoblatt und unter der Überschrift “SORMAS SymptomtageBuch” das Teilnehmerhandbuch SORMAS-SB”<br><br>' +
        'Wenn Sie technische Probleme haben, melden Sie sich bitte bei Ihrem Gesundheitsamt, Ihr Anliegen wird dann an die entsprechende Stelle weitergeleitet.<br><br>' +
        'Bei gesundheitlichen Problemen oder Unsicherheiten wenden Sie sich bitte an Ihre*n Arzt/Ärztin oder das Gesundheitsamt.<br><br>' +
        'Vielen Dank und beste Wünsche für Ihre Gesundheit!<br><br>' +
        'Ihr SORMAS-SB Team.',
    };
  }

  return {
    /**
     * Creates a registration mail for professional roles
     * @returns {MailContent}
     */
    createRegistrationMail: createRegistrationMail,

    /**
     * Creates a registration mail for sormas probands
     * @returns {MailContent}
     */
    createSormasRegistrationMail: createSormasRegistrationMail,
  };
})();

module.exports = mailTemplateService;
