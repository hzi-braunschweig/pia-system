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
  createUser,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  getToken,
  login,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';

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
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };

    createStudy(study)
      .then(() => createUser(ut))
      .then(() => getToken(ut.username))
      .then((token) => createPlannedProband(proband.pseudonym, token))
      .then(() => getToken(ut.username))
      .then((token) => createProband(proband, study.name, token))
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(proband.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      });
  });

  describe('manage password', () => {
    it('should test "Manage Password" functionality', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einstellungen')
        .click();

      cy.get('[data-e2e="change-password-button"]').click();

      cy.expectPathname('/settings/change-password');
    });

    it('should test change password', () => {
      const updatePassword = ',dYv3zg;r:CD';

      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einstellungen')
        .click();

      cy.get('[data-e2e="change-password-button"]').click();

      cy.get('#oldPassword').type(newPassword, {
        parseSpecialCharSequences: false,
      });
      cy.get('#newPassword1').type(updatePassword, {
        parseSpecialCharSequences: false,
      });
      cy.get('#newPassword2').type(updatePassword, {
        parseSpecialCharSequences: false,
      });

      cy.get('#changePasswordButton').click();

      cy.expectPathname('/home');
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

      cy.expectPathname('/login');
    });
  });
});
