/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MailContent, RealmRole } from '@pia/lib-service-core';
import { config } from '../config';

export class MailTemplateService {
  /**
   * Creates a registration mail for professional roles
   */
  public static createRegistrationMail(
    password: string,
    role: RealmRole
  ): MailContent {
    return {
      subject: 'Ein PIA Account wurde für Sie erstellt',
      text:
        'Soeben wurde für Sie ein Account für die Nutzung von PIA erstellt\n\n' +
        'Ihre Rolle: ' +
        role +
        '\nIhr Passwort: ' +
        password +
        '\n\nSie können sich unter "' +
        config.adminAppUrl +
        '" mit Ihrer Email-Adresse und dem obigen Passwort anmelden.\n\n' +
        'Viel Spaß!',
      html:
        'Soeben wurde für Sie ein Account für die Nutzung von PIA erstellt<br><br>' +
        'Ihre Rolle: ' +
        role +
        '<br>Ihr Passwort: ' +
        password +
        '<br><br>Sie können sich unter <a href="' +
        config.adminAppUrl +
        '">PIA Webapp</a> mit Ihrer Email-Adresse und dem obigen Passwort anmelden.<br><br>' +
        'Viel Spaß!',
    };
  }
}
