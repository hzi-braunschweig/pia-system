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

const short = require('short-uuid');
const translator = short();

let study;
let proband;
let ut;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Proband", Tab: Settings', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    proband = generateRandomProbandForStudy(study.name);
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
      .then((token) => createProband(proband, token))
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(proband.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      });
  });

  it('should test whether there are only buttons that are allowed to be there', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einstellungen')
      .click();
    cy.get('[data-e2e="e2e-settings-content"]').contains('Einstellungen');

    cy.get('#buttonconfirm').click();
  });

  it('should test capturing of log data switching on and off', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einstellungen')
      .click();
    cy.get('[data-e2e="e2e-settings-content"]').contains('Einstellungen');

    cy.get('[data-e2e="acquisition-of-log-data-checkbox"]').click();
    cy.get('#buttonconfirm').click();

    cy.contains('Ihre Einstellungen wurden erfolgreich gespeichert');

    cy.get('[data-e2e="acquisition-of-log-data-checkbox"]').click();
    cy.get('#buttonconfirm').click();
    cy.contains('Ihre Einstellungen wurden erfolgreich gespeichert');
  });

  it('should test "Manage Password" functionality', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einstellungen')
      .click();

    cy.get('[data-e2e="e2e-change-password-icon"]').click();

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

    cy.get('[data-e2e="e2e-change-password-icon"]').click();

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
