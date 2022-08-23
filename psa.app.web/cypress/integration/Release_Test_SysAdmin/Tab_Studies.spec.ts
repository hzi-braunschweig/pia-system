/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import totp from 'totp-generator';

import { generateRandomStudy, login, logout } from '../../support/commands';
import {
  createProfessionalUser,
  loginSysAdmin,
  ProfessionalUser,
  UserCredentials,
} from '../../support/user.commands';
import short from 'short-uuid';

const translator = short();

const appUrl = '/admin/';

describe('Release Test, role: "SysAdmin", Studies', () => {
  beforeEach(() => {
    // get sure totp is configured
    loginSysAdmin();
  });

  it('should create a study with required totp', () => {
    const study = generateRandomStudy();
    const forscher: ProfessionalUser = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [],
    };

    cy.visit(appUrl);
    loginWithTotp();
    cy.expectPathname('/admin/home');

    // Create study as SysAdmin
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Studien').click();

    cy.get('[data-e2e="create-study-button"]').click();

    cy.get('[data-e2e="study-name-input"]').type(study.name);
    cy.get('[data-e2e="study-description-input"]').type(study.description);
    cy.get('[data-e2e="required-otp-checkbox"] input').should('be.checked');

    cy.get('[data-e2e="confirm-create-study-button"]').click();

    cy.get('[data-e2e="study-list"]').contains(study.name);
    logout(false);

    // Login as Forscher and check if totp is required
    createProfessionalUser(forscher, study.name).then((credentials) => {
      login(credentials.username, credentials.password);
      cy.get('#kc-content')
        .find('#kc-totp-secret-qr-code')
        .should('be.visible');
    });
  });

  function loginWithTotp() {
    cy.fixture('users')
      .then((res) =>
        cy.wrap<UserCredentials>(res.existing.SysAdmin).as('adminCredentials')
      )
      .then((credentials) => login(credentials.username, credentials.password));

    cy.readFile('.e2e-totp-secret').then((totpSecret) => {
      const token = totp(totpSecret);

      cy.get('#kc-otp-login-form #otp').type(token);

      cy.get('#kc-login').click();
    });
  }
});
