/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fetchPasswordForUserFromMailHog } from '../../support/user.commands';
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
} from '../../support/commands';

const short = require('short-uuid');
const translator = short();

let probandA;
let probandB;
let probandC;

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

const appUrl = '/';

describe('Release Test, role: "Forscher", Tab: Study Welcome Text', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    study2 = generateRandomStudy();
    study3 = generateRandomStudy();
    study4 = generateRandomStudy();

    probandA = generateRandomProbandForStudy(study.name);
    probandB = generateRandomProbandForStudy(study2.name);
    probandC = generateRandomProbandForStudy(study3.name);

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [
        { study_id: study.name, access_level: 'admin' },
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };

    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [
        { study_id: study.name, access_level: 'admin' },
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [
        { study_id: study.name, access_level: 'admin' },
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };

    // Create Study A, Study B and Study C
    createStudy(study);
    createStudy(study2);
    createStudy(study3);
    createStudy(study4)
      .then(() => createUser(ut))
      .then(() => createUser(pm))
      .then(() => createUser(forscher))
      .then(() => fetchPasswordForUserFromMailHog(forscher.username))
      .then((cred) => {
        forscherCredentials.username = cred.username;
        forscherCredentials.password = cred.password;
      })
      .then(() => getToken(ut.username))
      .then((token) => createPlannedProband(probandA.pseudonym, token))
      .then(() => getToken(ut.username))
      .then((token) => createProband(probandA, token))
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(probandA.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      })
      .then(() => getToken(ut.username))
      .then((token) => createPlannedProband(probandB.pseudonym, token))
      .then(() => getToken(ut.username))
      .then((token) => createProband(probandB, token))
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(probandB.pseudonym, token)
      )
      .then((cred) => {
        probandCredentialsB.username = cred.username;
        probandCredentialsB.password = cred.password;
      })
      .then(() => getToken(ut.username))
      .then((token) => createPlannedProband(probandC.pseudonym, token))
      .then(() => getToken(ut.username))
      .then((token) => createProband(probandC, token))
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(probandC.pseudonym, token)
      )
      .then((cred) => {
        probandCredentialsC.username = cred.username;
        probandCredentialsC.password = cred.password;
      });
  });

  it('should create welcome texts for StudyA, StudyB, StudyC. Proband should see only welcome text for his study', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Begrüßungstext')
      .click();

    // Create welcome text for study A
    // Select first study name
    cy.get('[data-e2e="e2e-study-select"]').click();
    cy.get('[data-e2e="e2e-study-options"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-welcome-text-input"]').type(
      '<h1>Welcome</h1> \n' + 'If you have any questions, please contact us'
    );
    cy.get('[data-e2e="e2e-publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    // Create welcome text for study B
    // Select second study name
    cy.get('[data-e2e="e2e-study-select"]').click();
    cy.get('[data-e2e="e2e-study-options"]').contains(study2.name).click();
    cy.get('[data-e2e="e2e-welcome-text-input"]').clear().type('Foo Bar');
    cy.get('[data-e2e="e2e-publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#changeaccount').click();

    // Check text for proband A
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

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();
    cy.get('#changeaccount').click();

    // Check text for proband B
    login(probandCredentials.username, probandCredentials.password);
    login(probandCredentialsB.username, probandCredentialsB.password);
    changePassword(probandCredentialsB.password, newPassword);

    cy.get('[data-e2e="e2e-home-content"]').find('h1').should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]')
      .contains('If you have any questions, please contact us')
      .should('not.exist');
    cy.get('[data-e2e="e2e-home-content"]').contains('Foo Bar').should('exist');

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();
    cy.get('#changeaccount').click();

    // Check text for proband C
    login(probandCredentials.username, probandCredentials.password);
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
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Begrüßungstext')
      .click();

    // Create welcome test for study A
    // Select first study name
    cy.get('[data-e2e="e2e-study-select"]').click();
    cy.get('[data-e2e="e2e-study-options"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-welcome-text-input"]').type('<h1>First Text</h1>');
    cy.get('[data-e2e="e2e-publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#changeaccount').click();

    // Test that first test is shown
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-home-content"]')
      .find('h1')
      .contains('First Text')
      .should('exist');

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();
    cy.get('#changeaccount').click();

    login(forscherCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Begrüßungstext')
      .click();

    // Change text for study A
    cy.get('[data-e2e="e2e-study-select"]').click();
    cy.get('[data-e2e="e2e-study-options"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-welcome-text-input"]')
      .clear()
      .type('<h1>Second Text</h1>');
    cy.get('[data-e2e="e2e-publish-text-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#changeaccount').click();

    // Test that welcome text is changed
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
