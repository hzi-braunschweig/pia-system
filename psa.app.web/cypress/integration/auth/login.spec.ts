/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UserCredentials } from '../../support/user.commands';
import Chainable = Cypress.Chainable;
import { login } from '../../support/commands';

describe('Startseite', () => {
  beforeEach(() => {
    cy.createRandomStudy()
      .as('studyId')
      .then((studyId) => {
        cy.disableFourEyesOpposition(studyId)
          .then(() => cy.createRandomProband(studyId))
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

    cy.get<string>('@studyId').then((studyId) => {
      cy.get<UserCredentials>('@probandCredentials').then(
        (probandCredentials) =>
          cy.deleteProband(probandCredentials.username, studyId)
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
