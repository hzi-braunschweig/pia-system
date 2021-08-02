/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fetchPasswordForUserFromMailHog } from '../../support/user.commands';
import {
  changePassword,
  createStudy,
  createUser,
  generateRandomStudy,
  login,
} from '../../support/commands';

const short = require('short-uuid');
const translator = short();

let study;
let forscher;
const forscherCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Forscher", General', () => {
  beforeEach(() => {
    study = generateRandomStudy();

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };

    createStudy(study)
      .then(() => createUser(forscher))
      .then(() => fetchPasswordForUserFromMailHog(forscher.username))
      .then((cred) => {
        forscherCredentials.username = cred.username;
        forscherCredentials.password = cred.password;
      });
  });

  it('should login and change password', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);
    cy.expectPathname('/home');
  });
  it('should include proper Menu items', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Startseite')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Verwaltung')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Teilnehmende')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Studien')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einwilligungen')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Begrüßungstext')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Logs')
      .should('be.visible');
  });
  it('should logout', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Abmelden').click();
    cy.expectPathname('/login');
  });
});
