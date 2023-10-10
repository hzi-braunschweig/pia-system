/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Chainable = Cypress.Chainable;
import { UserCredentials } from '../../../support/user.commands';
import { login } from '../../../support/commands';
import { Study } from '../../../support/study.commands';

describe('Login', () => {
  beforeEach(() => {
    cy.createRandomStudy()
      .as('study')
      .then((study: Study) => {
        cy.disableFourEyesOpposition(study.name)
          .then(() => cy.createRandomProband(study.name))
          .as('probandCredentials');
      });
  });

  it('should login a proband', () => {
    cy.visit('/');
    cy.get('[data-e2e="login-form"]');

    loginProband();
    cy.expectPathname('/home');
  });

  it('should not be possible to use PIA with a valid token but deactivated account', () => {
    cy.visit('/');
    cy.get('[data-e2e="login-form"]');

    loginProband();
    cy.expectPathname('/home');

    cy.get<Study>('@study').then((study) => {
      cy.get<UserCredentials>('@probandCredentials').then(
        (probandCredentials) =>
          cy.deleteProband(probandCredentials.username, study.name)
      );
      cy.reload();

      cy.get('[data-e2e="login-form"]').then(() => loginProband(true));
      cy.get('[data-e2e="login-form"]');
    });
  });

  function loginProband(skipUsername = false): Chainable<UserCredentials> {
    return cy
      .get<UserCredentials>('@probandCredentials')
      .then(({ username, password }) => {
        login(username, password, skipUsername);
      });
  }
});
