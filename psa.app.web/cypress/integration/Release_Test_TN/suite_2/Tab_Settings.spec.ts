/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  changePassword,
  createPlannedProband,
  createProband,
  createStudy,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';
import {
  createProfessionalUser,
  loginProfessional,
  UserCredentials,
} from 'cypress/support/user.commands';

const short = require('short-uuid');
const translator = short();

let study;
let proband: CreateProbandRequest;
let ut;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Proband", Tab: Settings', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    proband = generateRandomProbandForStudy();
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    createStudy(study);

    createProfessionalUser(ut, study.name).as('utCred');

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband.pseudonym, token);
        createProband(proband, study.name, token);
        getCredentialsForProbandByUsername(proband.pseudonym, token).then(
          (cred) => {
            probandCredentials.username = cred.username;
            probandCredentials.password = cred.password;
          }
        );
      });
  });

  describe('manage password', () => {
    it('should change the user`s password', () => {
      const updatePassword = ',dYv3zg;r:CD';

      cy.intercept({
        method: 'GET',
        url: '/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/login-status-iframe.html/init*',
      }).as('loginStatusIframe');

      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einstellungen')
        .click();

      cy.get('[data-e2e="change-password-button"]').click();

      cy.expectPathname('/api/v1/auth/realms/pia-proband-realm/account/');

      cy.wait('@loginStatusIframe');
      cy.wait('@loginStatusIframe');
      cy.wait('@loginStatusIframe');
      cy.wait('@loginStatusIframe');

      cy.get('#landing-signingin > a').contains('Anmeldung').click();

      cy.get('.pf-c-data-list__item-row').contains('Aktualisieren').click();

      cy.get('#password-new').type(updatePassword, {
        parseSpecialCharSequences: false,
      });
      cy.get('#password-confirm').type(updatePassword, {
        parseSpecialCharSequences: false,
      });

      cy.get('button[type="submit"]').click();

      cy.wait('@loginStatusIframe');

      cy.get('#referrerLink').should('be.visible').click();

      cy.expectPathname('/settings');
    });
  });

  describe('account deletion', () => {
    it.only('should delete its own account', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einstellungen')
        .click();

      cy.get('[data-e2e="delete-account-button"]').click();

      cy.get('[data-e2e="delete-account-keep-health-data-button"]').click();

      cy.get('[data-e2e="delete-account-confirm-button"]').click();

      cy.get('[data-e2e="delete-account-success-text"]');

      cy.get('[data-e2e="back-to-login-button"]').click();

      cy.expectPathname(
        '/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/auth'
      );
    });
  });
});
