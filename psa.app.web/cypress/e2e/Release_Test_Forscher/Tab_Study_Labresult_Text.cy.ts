/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Chainable = Cypress.Chainable;
import {
  createProfessionalUser,
  loginProfessional,
  ProfessionalUser,
  UserCredentials,
} from '../../support/user.commands';
import {
  changePassword,
  createPlannedProband,
  createProband,
  generateRandomProbandForStudyWithComplicances,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
  logout,
  RandomStudy,
} from '../../support/commands';
import { CreateProbandRequest } from '../../../src/app/psa.app.core/models/proband';
import { createStudy, selectStudy } from 'cypress/support/study.commands';
import { updateLabResultTemplateText } from 'cypress/support/sample-tracking.commands';

const short = require('short-uuid');
const translator = short();

let proband: CreateProbandRequest;

let study: RandomStudy;
let forscher: ProfessionalUser;
let ut: ProfessionalUser;

const forscherCredentials = { username: '', password: '' };
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const adminAppUrl = '/admin/';
const probandAppUrl = '/';

describe('Release Test, role: "Forscher", Tab: Study Labresult Text', () => {
  beforeEach(() => {
    study = { ...generateRandomStudy(), name: 'Teststudie' };

    proband = generateRandomProbandForStudyWithComplicances();

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [],
    };

    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    createStudy(study);

    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(forscher, study.name).then((cred) => {
      forscherCredentials.username = cred.username;
      forscherCredentials.password = cred.password;
    });
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createPlannedProband(proband.pseudonym, token));

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createProband(proband, study.name, token));

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) =>
        getCredentialsForProbandByUsername(proband.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      });

    updateLabResultTemplateText(
      forscherCredentials,
      study.name,
      'existing template text'
    );
  });

  it('should edit the lab result template text and show probands the edited text', () => {
    // forscher edits lab result text
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    selectStudy(study.name);
    cy.get('[data-e2e="edit-labresult-template-text-button"]').click();
    cy.get('[data-e2e="markdown-editor-textarea"]').clear();
    cy.get('[data-e2e="markdown-editor-textarea"]').type(
      `
        e2e template test text      
      `,
      { parseSpecialCharSequences: false }
    );
    cy.get('[data-e2e="publish-text-button"]').click();
    cy.get('#confirmbutton').click();
    logout(false);

    // updated text is shown to proband
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Laborergebnisse')
      .click();

    cy.get('[data-e2e="laboratory-results-details"]').click();

    cy.contains('e2e template test text').should('exist');

    logout();
  });
});
