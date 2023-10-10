/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createProfessionalUser,
  fetchPasswordResetLinkForUserFromMailHog,
  loginProfessional,
  UserCredentials,
} from '../../../support/user.commands';
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
  updateProbandData,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';

const short = require('short-uuid');
const translator = short();

let study;
let proband: CreateProbandRequest;
let ut;
let pm;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Proband", General', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    proband = generateRandomProbandForStudy();
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
    };

    createStudy(study);
    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(pm, study.name).as('pmCred');

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

    cy.get<UserCredentials>('@pmCred')
      .then(loginProfessional)
      .then((token) =>
        updateProbandData(
          proband.pseudonym,
          {
            email: `${proband.pseudonym}@testpia-app.de`,
            haus_nr: '76',
            plz: '53117',
          },
          token
        )
      );
  });

  it('should login and change password', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.expectPathname('/home');
  });

  it('should test "Forgot password" functionality', () => {
    cy.visit(appUrl);

    // Request new Password
    cy.get('.login-pf-settings a').click();
    cy.get('#kc-info-wrapper').contains('Geben Sie Ihren Benutzernamen ein');

    cy.get('.pf-c-form-control').type(proband.pseudonym);
    cy.get('input[type="submit"]').click();

    fetchPasswordResetLinkForUserFromMailHog(
      `${proband.pseudonym}@testpia-app.de`
    ).then((passwordResetUrl) => {
      expect(passwordResetUrl).to.be.a('string');
      cy.visit(passwordResetUrl);

      // Change password
      cy.get('#password-new').type(newPassword);
      cy.get('#password-confirm').type(newPassword);
      cy.get('input[type="submit"]').click();

      cy.expectPathname('/home');
    });
  });

  it('it should test "Login"', () => {
    cy.visit(appUrl);

    login(probandCredentials.username, probandCredentials.password);
    // Change password
    changePassword(probandCredentials.password, newPassword);
    cy.expectPathname('/home');
  });

  it('it should test "Logout"', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    // Change password
    changePassword(probandCredentials.password, newPassword);
    logout();
  });
});
