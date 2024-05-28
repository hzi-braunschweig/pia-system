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
  logout,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';
import {
  createProfessionalUser,
  loginProfessional,
  UserCredentials,
} from 'cypress/support/user.commands';
import Chainable = Cypress.Chainable;

const short = require('short-uuid');
const translator = short();

let study;
let proband: CreateProbandRequest;
let ut;

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
        getCredentialsForProbandByUsername(proband.pseudonym, token).as(
          'probandCredentials'
        );
      });
  });

  describe('manage password', () => {
    it('should change the user`s password', () => {
      const updatePassword = ',dYv3zg;r:CD';

      cy.visit(appUrl);
      loginProband();
      changeProbandPassword();
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einstellungen')
        .click();

      cy.get('[data-e2e="change-password-button"]').click();

      cy.expectPathname('/api/v1/auth/realms/pia-proband-realm/account/');

      cy.get('#landing-signingin > a')
        .contains('Passwort und Authentifizierung')
        .click();

      cy.get('.pf-c-data-list__item-row').contains('Aktualisieren').click();

      cy.get('#password-new').type(updatePassword, {
        parseSpecialCharSequences: false,
      });
      cy.get('#password-confirm').type(updatePassword, {
        parseSpecialCharSequences: false,
      });

      cy.get('button[type="submit"]').click();
      cy.get('#referrerLink').should('be.visible').click();

      cy.expectPathname('/settings');

      logout();
    });
  });

  describe('account deletion', () => {
    it('should delete its own account', () => {
      cy.visit(appUrl);
      loginProband();
      changeProbandPassword();

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

  function loginProband(skipUsername = false): Chainable<UserCredentials> {
    return cy
      .get<UserCredentials>('@probandCredentials')
      .then(({ username, password }) => {
        login(username, password, skipUsername);
      });
  }

  function changeProbandPassword(): Chainable<UserCredentials> {
    return cy
      .get<UserCredentials>('@probandCredentials')
      .then(({ username }) => {
        changePassword(username, newPassword);
      });
  }
});
