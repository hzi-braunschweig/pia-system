/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createProfessionalUser,
  loginProfessional,
  UserCredentials,
} from '../../support/user.commands';
import {
  changePassword,
  createPlannedProband,
  createProband,
  createStudy,
  createUser,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
  logout,
} from '../../support/commands';
import { CreateProbandRequest } from '../../../src/app/psa.app.core/models/proband';
import { selectStudy } from 'cypress/support/study.commands';

const short = require('short-uuid');
const translator = short();

let probandA: CreateProbandRequest;
let probandB: CreateProbandRequest;
let probandC: CreateProbandRequest;

let study;
let study2;
let study3;
let study4;
let forscher;
let ut;
let pm;
const forscherCredentials = { username: '', password: '' };
const probandCredentials = { username: '', password: '' };
const probandCredentialsB = { username: '', password: '' };
const probandCredentialsC = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const adminAppUrl = '/admin/';
const probandAppUrl = '/';

describe('Release Test, role: "Forscher", Tab: Study Welcome Text', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    study2 = generateRandomStudy();
    study3 = generateRandomStudy();
    study4 = generateRandomStudy();

    probandA = generateRandomProbandForStudy();
    probandB = generateRandomProbandForStudy();
    probandC = generateRandomProbandForStudy();

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };

    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };

    // Create Study A, Study B and Study C
    createStudy(study);
    createStudy(study2);
    createStudy(study3);
    createStudy(study4);

    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(forscher, study.name).then((cred) => {
      forscherCredentials.username = cred.username;
      forscherCredentials.password = cred.password;
    });

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createPlannedProband(probandA.pseudonym, token));

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createProband(probandA, study.name, token));

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) =>
        getCredentialsForProbandByUsername(probandA.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      });

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createPlannedProband(probandB.pseudonym, token));
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createProband(probandB, study2.name, token));
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) =>
        getCredentialsForProbandByUsername(probandB.pseudonym, token)
      )
      .then((cred) => {
        probandCredentialsB.username = cred.username;
        probandCredentialsB.password = cred.password;
      });
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createPlannedProband(probandC.pseudonym, token));
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => createProband(probandC, study3.name, token));
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) =>
        getCredentialsForProbandByUsername(probandC.pseudonym, token)
      )
      .then((cred) => {
        probandCredentialsC.username = cred.username;
        probandCredentialsC.password = cred.password;
      });
  });

  it('should create welcome texts for StudyA, StudyB, StudyC. Proband should see only welcome text for his study', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    // Create welcome text for study A
    // Select first study name
    selectStudy(study.name);

    cy.get('[data-e2e="edit-welcome-text-button"]').click();

    cy.get('[data-e2e="markdown-editor-textarea"]').type(
      '<h1>Welcome</h1> \n' + 'If you have any questions, please contact us'
    );
    cy.get('[data-e2e="publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    // Create welcome text for study B
    // Select second study name
    selectStudy(study2.name);

    cy.get('[data-e2e="edit-welcome-text-button"]').click();

    cy.get('[data-e2e="markdown-editor-textarea"]').clear().type('Foo Bar');
    cy.get('[data-e2e="publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    logout(false);

    // Check text for proband A
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-home-content"]')
      .find('h1')
      .contains('Welcome')
      .should('exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .contains('If you have any questions, please contact us')
      .should('exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .contains('Foo Bar')
      .should('not.exist');

    logout();

    // Check text for proband B
    login(probandCredentialsB.username, probandCredentialsB.password);
    changePassword(probandCredentialsB.password, newPassword);

    cy.get('[data-e2e="e2e-home-content"]').find('h1').should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .contains('If you have any questions, please contact us')
      .should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]').contains('Foo Bar').should('exist');

    logout();

    // Check text for proband C
    login(probandCredentialsC.username, probandCredentialsC.password);
    changePassword(probandCredentialsC.password, newPassword);

    cy.get('[data-e2e="e2e-home-content"]').find('h1').should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .contains('If you have any questions, please contact us')
      .should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .contains('Foo Bar')
      .should('not.exist');
  });

  it('should create welcome text for study A, then change welcome text and test if the text was really changed', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    // Create welcome test for study A
    // Select first study name
    selectStudy(study.name);

    cy.get('[data-e2e="edit-welcome-text-button"]').click();

    cy.get('[data-e2e="markdown-editor-textarea"]').type('<h1>First Text</h1>');
    cy.get('[data-e2e="publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    logout(false);

    // Test that first test is shown
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-home-content"]')
      .find('h1')
      .contains('First Text')
      .should('exist');

    logout();

    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    // Change text for study A
    selectStudy(study.name);

    cy.get('[data-e2e="edit-welcome-text-button"]').click();

    cy.get('[data-e2e="markdown-editor-textarea"]')
      .clear()
      .type('<h1>Second Text</h1>');
    cy.get('[data-e2e="publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    logout(false);

    // Test that welcome text is changed
    cy.visit(probandAppUrl);
    login(probandCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-home-content"]')
      .find('h1')
      .contains('First Text')
      .should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .find('h1')
      .contains('Second Text')
      .should('exist');
  });
});
