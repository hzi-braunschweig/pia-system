/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createProfessionalUser,
  fetchPasswordForUserFromMailHog,
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
} from '../../support/commands';
import 'cypress-file-upload';
import { CreateProbandRequest } from '../../../src/app/psa.app.core/models/proband';

const path = require('path');

const short = require('short-uuid');
const translator = short();

let study;
let study2;
let study3;
let study4;
let someRandomAnotherStudy;
let forscher;
let proband: CreateProbandRequest;
let probandB: CreateProbandRequest;
let ut;
let pm;
const forscherCredentials = { username: '', password: '' };
const probandCredentials = { username: '', password: '' };
const probandCredentialsB = { username: '', password: '' };
const utCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const adminAppUrl = '/admin/';
const probandAppUrl = '/';

describe('Release Test, role: "Forscher", Administration', () => {
  const downloadsFolder = Cypress.config('downloadsFolder');

  beforeEach(() => {
    cy.task('deleteFolder', downloadsFolder);
    study = generateRandomStudy();
    study2 = generateRandomStudy();
    study3 = generateRandomStudy();
    study4 = generateRandomStudy();
    someRandomAnotherStudy = generateRandomStudy();

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };
    proband = generateRandomProbandForStudy();
    probandB = generateRandomProbandForStudy();

    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
    };
    createStudy(study);
    createStudy(study2);
    createStudy(study3);
    createStudy(study4);
    createStudy(someRandomAnotherStudy);

    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(pm, study.name).as('pmCred');
    createProfessionalUser(forscher, study.name).as('fCred');

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

        createPlannedProband(probandB.pseudonym, token);
        createProband(probandB, study.name, token);
        getCredentialsForProbandByUsername(probandB.pseudonym, token).then(
          (cred) => {
            probandCredentialsB.username = cred.username;
            probandCredentialsB.password = cred.password;
          }
        );
      });

    cy.get<UserCredentials>('@utCred').then((cred) => {
      utCredentials.username = cred.username;
      utCredentials.password = cred.password;
    });
    cy.get<UserCredentials>('@fCred').then((cred) => {
      forscherCredentials.username = cred.username;
      forscherCredentials.password = cred.password;
    });
  });

  it.skip('should create a questionnaire and check if it is directly visible by existing and also newly created proband', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type('Test Fragebogen');

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get('#mat-expansion-panel-header-0').click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Wie heißen Sie?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-1').click();
    cy.get('#cdk-accordion-child-1')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Wie alt sind Sie?');

    cy.get('#cdk-accordion-child-1')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-logout"]').click();

    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').contains('Test Fragebogen');

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('.mat-dialog-container').find('button').contains('OK').click();

    const proband2 = generateRandomProbandForStudy();
    const proband2Credentials = { username: '', password: '' };

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband2.pseudonym, token);
        createProband(proband2, study.name, token);
        getCredentialsForProbandByUsername(proband2.pseudonym, token).then(
          (cred) => {
            proband2Credentials.username = cred.username;
            proband2Credentials.password = cred.password;
          }
        );
      });

    login(proband2Credentials.username, proband2Credentials.password);
    changePassword(proband2Credentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').contains('Test Fragebogen');
  });

  it.skip('should create questionnaires "A" and "B", show questionnaire "B" to Proband only if condition in "A" met', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'First Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Wie alt sind Sie?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create second questionnaire
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Second Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get('[data-e2e="e2e-questionnaire-condition-set-button"]').click();
    cy.get('[data-e2e="e2e-show-questionnaire-condition-select"]').click();
    cy.get('.mat-option').contains('auf externen Fragebogen').click();

    cy.get('[data-e2e="e2e-condition-target-questionnaire-select"]').click();
    cy.get('.mat-option').contains('First Questionnaire (1)').click();

    cy.get('[data-e2e="e2e-condition-question-id-select"]').click();
    cy.get('.mat-option').contains('F1: Wie alt sind Sie?').click();

    cy.get('[data-e2e="e2e-condition-target-answer-option-select"]').click();
    cy.get('.mat-option').contains('UF 1:').click();

    cy.get('[data-e2e="e2e-condition-operand-select"]').click();
    cy.get('.mat-option').contains('>').click();

    cy.get('[data-e2e="e2e-condition-numeric-value-input"]').type('20');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Bitte beschreiben sie Ihre Symptome');
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Login as Proband
    cy.get('[data-e2e="e2e-logout"]').click();

    cy.visit(probandAppUrl);

    cy.intercept({
      method: 'GET',
      url: `/api/v1/compliance/${study.name}/text`,
    }).as('getText');

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('Second Questionnaire')
      .should('not.exist');
    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('First Questionnaire')
      .click();
    cy.get('[data-e2e="e2e-input-type-number"]').type('22');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    // Wait to make sure the questionnaires are (hopefully) fetched from the backend
    cy.wait('@getText');

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();
    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('Second Questionnaire')
      .should('exist');
  });

  // This test works only in chromium and headless. Does not work on Firefox,
  // because it does not start downloading file immediately but ask if you want to open it or download
  it('should export questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Export this questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('What is your name?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-export-questionnaire-button"]').click();

    const filename = path.join(
      downloadsFolder,
      'Export this questionnaire.json'
    );
    cy.readFile(filename).then((res) => {
      expect(res).to.exist;
      expect(res.name).to.equal('Export this questionnaire');
      expect(res.questions).to.have.length(1);
    });
  });

  it('should import questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    cy.get('[data-e2e="e2e-import-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-file-input"]').attachFile(
      'questionnnaire_for_importing.json'
    );

    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('.mat-option').contains(study.name).click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-questionnaire-type-select"]')
      .contains('Für Teilnehmende')
      .should('exist');
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]')
      .contains('Einmal')
      .should('exist');

    cy.get('[data-e2e="e2e-activate-after-days-input"]').should(
      'have.value',
      0
    );
    cy.get('[data-e2e="e2e-notification-tries"]').should('have.value', 0);

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .contains('Frage : Where are you from?')
      .should('exist');
  });

  it.skip('should test filter functionality', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create first questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'First Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('What is your name?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create second questionnaire
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Second Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Where are you from?');
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create second questionnaire
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Third Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-4')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('How old are you?');
    cy.get('#cdk-accordion-child-4')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    //
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Check if all 3 questionnaires listed
    cy.get('[data-e2e="e2e-questionnaire-name"]').should('have.length', 3);
    cy.get('[data-e2e="e2e-filter-questionnaires-input"]').type('Second');
    cy.get('[data-e2e="e2e-questionnaire-name"]').should('have.length', 1);
    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('Second Questionnaire')
      .should('exist');
  });
  it('should create new version of questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Sample Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Where are you from?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create new version
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-questionnaire-name"]').should('have.length', 2);
    cy.get('[data-e2e="e2e-questionnaire-version"]')
      .contains('1')
      .should('exist');
    cy.get('[data-e2e="e2e-questionnaire-version"]')
      .contains('2')
      .should('exist');
  });

  it.skip('should test versioning for singular questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Questionnaire Version 1'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('How old are you?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').click();
    cy.get('[data-e2e="e2e-input-type-number"]').type('42');
    cy.get('p').contains('How old are you?').should('exist');
    cy.get('[data-e2e="e2e-save-questionnaire-and-exit"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();

    // Login as forscher
    login(forscherCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('.mat-row').contains(study.name).get('#editicon').click();

    cy.get('.mat-expansion-panel-header-title')
      .contains('Frage : How old are you?')
      .click();

    // Delete question
    cy.get('[data-e2e="e2e-remove-question-button"]').click();
    // Add new question
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();

    cy.get('[data-e2e="e2e-question-expansion-panel"]').first().click();
    cy.get('.mat-expansion-panel-body')
      .first()
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Are you over 18');
    cy.get('.mat-expansion-panel-body')
      .first()
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Einzelauswahl').click();

    cy.get('[data-placeholder="Wert 1"]').type('Yes');
    cy.get('[data-placeholder="Code 1"]').type('0');
    cy.get('[data-placeholder="Wert 2"]').type('No');
    cy.get('[data-placeholder="Code 2"]').type('1');

    // Update questionnaire Version
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband
    cy.visit(probandAppUrl);
    login(probandCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').first().click();
    cy.get('[data-e2e="e2e-navigation-button"]').click();

    cy.get('[data-e2e="e2e-questionnaire-list"]')
      .contains('How old are you?')
      .click();
    cy.get('p').contains('How old are you?').should('exist');
    cy.get('[data-e2e="e2e-save-questionnaire-and-exit"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();

    const proband1 = generateRandomProbandForStudy();

    const probandCredentials1 = { username: '', password: '' };

    // Fresh created proband should see the Version 2 of the questionnaire
    cy.get<UserCredentials>('@utCred')
      .then((cred) => cy.loginProfessional(ut))
      .then((token) => createPlannedProband(proband1.pseudonym, token))
      .then(() => cy.get<UserCredentials>('@utCred'))
      .then((cred) => cy.loginProfessional(ut))
      .then((token) => createProband(proband1, study.name, token))
      .then(() => cy.get<UserCredentials>('@utCred'))
      .then((cred) => cy.loginProfessional(ut))
      .then((token) =>
        getCredentialsForProbandByUsername(proband1.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials1.username = cred.username;
        probandCredentials1.password = cred.password;
      })
      .then(() => {
        login(probandCredentials1.username, probandCredentials1.password);
        changePassword(probandCredentials1.password, newPassword);

        cy.get('[data-e2e="e2e-sidenav-content"]').click();
        cy.get('[data-e2e="e2e-sidenav-content"]')
          .contains('Fragebögen')
          .click();

        cy.get('[data-e2e="e2e-questionnaire-name"]').click();
        cy.get('[data-e2e="e2e-navigation-button"]').click();

        cy.get('[data-e2e="e2e-questionnaire-list"]')
          .contains('Are you over 18')
          .click();

        cy.get('[data-e2e="e2e-input-type-radio-group"]')
          .contains('Yes')
          .click();

        // Release questionnaire
        cy.get('[data-e2e="e2e-swiper-button-next"]').click();
        cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
        cy.get('#confirmbutton').click();
      });
  });

  it.skip('should test spontaneous questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create spontaneous questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Spontaneous Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Spontan').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Where are you from?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband A
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-spontaneous-questionnaire-edit-button"]').click();

    // The version 1 should be shown
    cy.get('p').contains('Where are you from?').should('exist');
    cy.get('[data-e2e="e2e-input-type-text"]').type('Bonn');

    // Release questionnaire
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();

    cy.visit(adminAppUrl);
    login(forscherCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('.mat-row').contains(study.name).get('#editicon').click();

    // Create new Version of questionnaire
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('#mat-expansion-panel-header-3').click();
    cy.get('#questiontextinput').clear().type('What is your name?');

    // Update questionnaire Version
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband A
    cy.visit(probandAppUrl);
    login(probandCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-spontaneous-questionnaire-edit-button"]').click();

    cy.get('[data-e2e="e2e-input-type-text"]').type('Johny');
    cy.get('p').contains('What is your name?').should('exist');

    // Release questionnaire
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();

    // Login as Proband B
    login(probandCredentialsB.username, probandCredentialsB.password);
    changePassword(probandCredentialsB.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-spontaneous-questionnaire-edit-button"]').click();

    cy.get('[data-e2e="e2e-input-type-text"]').type('Johny');
    cy.get('p').contains('What is your name?').should('exist');

    // Release questionnaire
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();
  });

  it('should update a questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample question
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Sample Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    // Add Free text
    cy.get('#mat-expansion-panel-header-0').click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Where are you from?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    // Add Numerical answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-1').click();
    cy.get('#cdk-accordion-child-1')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('How old are you?');
    cy.get('#cdk-accordion-child-1')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Numerisch').click();

    // Add multiple answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-2').click();
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('What are your symptoms?');
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Mehrfach').click();

    cy.get('[data-placeholder="Wert 1"]').clear();
    cy.get('[data-placeholder="Wert 1"]').type('Yes');
    cy.get('[data-placeholder="Code 1"]').type('0');
    cy.get('[data-placeholder="Wert 2"]').type('No');
    cy.get('[data-placeholder="Code 2"]').type('1');
    cy.get('[data-placeholder="Wert 3"]').type('No');
    cy.get('[data-placeholder="Code 3"]').type('2');
    cy.get('#mat-expansion-panel-header-2').click();

    // Add multiple answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-3').click();
    cy.get('#cdk-accordion-child-3')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('What is a gender?');
    cy.get('#cdk-accordion-child-3')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Einzelauswahl').click();

    cy.get('#cdk-accordion-child-3')
      .find('[data-placeholder="Wert 1"]')
      .type('Male');
    cy.get('#cdk-accordion-child-3')
      .find('[data-placeholder="Code 1"]')
      .type('0');
    cy.get('#cdk-accordion-child-3')
      .find('[data-placeholder="Wert 2"]')
      .type('Female');
    cy.get('#cdk-accordion-child-3')
      .find('[data-placeholder="Code 2"]')
      .type('1');

    // Add datum answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-4').click();
    cy.get('#cdk-accordion-child-4')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('When is your birthday?');
    cy.get('#cdk-accordion-child-4')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Datum').click();

    // Add probe answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-5').click();
    cy.get('#cdk-accordion-child-5')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Pleas scan the probe');
    cy.get('#cdk-accordion-child-5')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Probe').click();

    // Add PZN answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-6').click();
    cy.get('#cdk-accordion-child-6')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('PZN');
    cy.get('#cdk-accordion-child-6')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('PZN').click();

    // Add Foto answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-7').click();
    cy.get('#cdk-accordion-child-7')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Please upload your Photo');
    cy.get('#cdk-accordion-child-7')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Foto').click();

    // Add Zeitstempel answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-8').click();
    cy.get('#cdk-accordion-child-8')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Please add Timestamp');
    cy.get('#cdk-accordion-child-8')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Zeitstempel').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('#questionList').find('li').should('have.length', 9);
  });

  it.skip('should deactivate a questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('.mat-option').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]').type(
      'Sample Questionnaire'
    );

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('.mat-option').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('.mat-option').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').type('0');

    cy.get(
      '[data-e2e="e2e-question-expansion-panel"] mat-expansion-panel-header'
    )
      .first()
      .click();
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-question-text-input"]')
      .type('Where are you from?');
    cy.get('#cdk-accordion-child-0')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('.mat-option').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Deactivate questionnaire
    cy.get('[data-e2e="e2e-questionnaire-deactivate-button"]').click();
    cy.get('#confirmButton').click();

    cy.get('[data-e2e="e2e-questionnaire-deactivation-hint"]').should('exist');

    // Check visibility of action buttons
    cy.get('[data-e2e="e2e-export-questionnaire-button"]').should('exist');
    cy.get('[data-e2e="e2e-update-questionnaire-button"]').should('not.exist');
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').should('not.exist');
    cy.get('[data-e2e="e2e-questionnaire-deactivate-button"]').should(
      'not.exist'
    );
  });
});
