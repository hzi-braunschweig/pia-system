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
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
} from '../../support/commands';
import 'cypress-file-upload';
import { CreateProbandRequest } from '../../../src/app/psa.app.core/models/proband';
import { expectLocation } from '../../support/helper.commands';

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
const probandAuthFormUrl =
  '/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/auth';
const adminAuthFormUrl =
  '/api/v1/auth/realms/pia-admin-realm/protocol/openid-connect/auth';

function getExpansionPanel(eq: number) {
  return cy
    .get('mat-expansion-panel')
    .eq(eq)
    .then((elm) => {
      const createWrappedElement = () => cy.wrap(elm); // ensure getting a freshly wrapped element each time
      return createWrappedElement;
    });
}

describe('Release Test, role: "Forscher", Administration', () => {
  const downloadsFolder = Cypress.config('downloadsFolder');

  beforeEach(() => {
    cy.intercept({
      method: 'POST',
      url: '/admin/api/v1/questionnaire/questionnaires',
    }).as('saveQuestionnaire');

    cy.intercept({
      method: 'POST',
      url: '/admin/api/v1/questionnaire/revisequestionnaire/*',
    }).as('reviseQuestionnaire');

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

  it('should create a questionnaire and check if it is directly visible by existing and also newly created proband', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Test Fragebogen', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(0)
      .click();

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Wie heißen Sie?');

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();

    cy.get('[data-e2e="option"]').contains('Freitext').click();

    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(1)
      .parent()
      .click();

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(1)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Wie alt sind Sie?');

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(1)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-logout"]').click();

    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').contains('Test Fragebogen');

    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('[data-e2e="dialog-button-accept"]').click();

    const proband2 = generateRandomProbandForStudy();

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband2.pseudonym, token);
        createProband(proband2, study.name, token);
        getCredentialsForProbandByUsername(proband2.pseudonym, token).then(
          (creds) => {
            login(creds.username, creds.password);
            changePassword(creds.password, newPassword);
          }
        );
      });

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').contains('Test Fragebogen');
  });

  it('should create questionnaires "A" and "B", show questionnaire "B" to Proband only if condition in "A" met', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('First Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(0)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Wie alt sind Sie?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create second questionnaire
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Second Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get('[data-e2e="e2e-questionnaire-condition-set-button"]').click();
    cy.get('[data-e2e="e2e-show-questionnaire-condition-select"]').click();
    cy.get('[data-e2e="option"]').contains('auf externen Fragebogen').click();

    cy.get('[data-e2e="e2e-condition-target-questionnaire-select"]').click();
    cy.get('[data-e2e="option"]').contains('First Questionnaire').click();

    cy.get('[data-e2e="e2e-condition-question-id-select"]').click();
    cy.get('[data-e2e="option"]').contains('F1: Wie alt sind Sie?').click();

    cy.get('[data-e2e="e2e-condition-target-answer-option-select"]').click();
    cy.get('[data-e2e="option"]').contains('UF 1:').click();

    cy.get('[data-e2e="e2e-condition-operand-select"]').click();
    cy.get('[data-e2e="option"]').contains('>').click();

    cy.get('[data-e2e="e2e-condition-numeric-value-input"]').focus().type('20');

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Bitte beschreiben sie Ihre Symptome');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();

    cy.get('[data-e2e="option"]').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('Second Questionnaire')
      .should('not.exist');
    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('First Questionnaire')
      .click();
    cy.get('[data-e2e="e2e-input-type-number"]')
      .find('input')
      .focus()
      .type('22');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();

    // Second Questionnaire will be shown after a while
    cy.contains('Bitte beschreiben sie Ihre Symptome');

    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Fragebögen')
      .closest('mat-button-toggle')
      .click();

    expectLocation('/questionnaires/user');

    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('Second Questionnaire')
      .should('exist');
  });

  it('should show warnings for variable names when editing questions and answer options', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    // input questionnaire settings
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains(study.name).click();

    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Test Fragebogen', { force: true });
    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();
    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    // open first question and edit text field
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(0)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Wie heißen Sie?{backspace}!');

    cy.get('[data-e2e="question-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="question-variable-name-warning-icon"]').should(
      'not.exist'
    );

    // Open answer option, set to single choice and edit text fields
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();

    cy.get('[data-e2e="option"]').contains('Einzelauswahl').click();
    cy.get('[data-e2e="e2e-answer-option-test-input"]')
      .focus()
      .type('Unterfrage A{backspace}B');

    cy.get('[data-e2e="question-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="question-variable-name-warning-icon"]').should(
      'not.exist'
    );

    // Edit answer option single choice values
    cy.get('[data-e2e="answer-option-values"]')
      .find('input')
      .eq(0)
      .type('Wert B{backspace}A');
    cy.get('[data-e2e="answer-option-values"]').find('input').eq(1).type('1');
    cy.get('[data-e2e="answer-option-values"]')
      .find('input')
      .eq(2)
      .type('Wert A{backspace}B');
    cy.get('[data-e2e="answer-option-values"]').find('input').eq(3).type('1');

    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'not.exist'
    );

    // save questionnaire
    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // In slower environments like in CI, we need to wait for the save request
    // to be done and for angular to actually know about the study
    // name in its component. As we have no way to know when the component is
    // ready, we additionally wait an arbitrary amount of time.
    cy.wait('@saveQuestionnaire');
    cy.wait(3000);

    // open question panel again
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(0)
      .click();

    // change question text
    cy.get('[data-e2e="e2e-question-text-input"]').focus().type('{backspace}?');

    cy.get('[data-e2e="question-variable-name-warning-text"]').should('exist');
    cy.get('[data-e2e="question-variable-name-warning-icon"]').should('exist');

    cy.get('[data-e2e="e2e-question-text-input"]').focus().type('{backspace}!');

    cy.get('[data-e2e="question-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="question-variable-name-warning-icon"]').should(
      'not.exist'
    );

    // change answer option text
    cy.get('[data-e2e="e2e-answer-option-test-input"]')
      .focus()
      .type('{backspace}A');

    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'exist'
    );

    cy.get('[data-e2e="e2e-answer-option-test-input"]')
      .focus()
      .type('{backspace}B');

    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'not.exist'
    );

    // change answer option single choice values texts
    cy.get('[data-e2e="answer-option-values"]')
      .find('input')
      .eq(0)
      .focus()
      .type('{backspace}C');
    cy.get('[data-e2e="answer-option-values"]')
      .find('input')
      .eq(2)
      .focus()
      .type('{backspace}D');

    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'exist'
    );

    cy.get('[data-e2e="answer-option-values"]')
      .find('input')
      .eq(2)
      .focus()
      .type('{backspace}B');

    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'exist'
    );

    cy.get('[data-e2e="answer-option-values"]')
      .find('input')
      .eq(0)
      .focus()
      .type('{backspace}A');

    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'not.exist'
    );

    // should be able to save with warnings and clear them
    cy.get('[data-e2e="e2e-question-text-input"]').focus().type('{backspace}?');
    cy.get('[data-e2e="e2e-answer-option-test-input"]')
      .focus()
      .type('{backspace}A');

    cy.get('[data-e2e="question-variable-name-warning-text"]').should('exist');
    cy.get('[data-e2e="question-variable-name-warning-icon"]').should('exist');
    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'exist'
    );

    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    cy.wait('@reviseQuestionnaire');

    cy.get('[data-e2e="e2e-question-expansion-panel"]')
      .children()
      .first()
      .click();

    cy.get('[data-e2e="question-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="question-variable-name-warning-icon"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-text"]').should(
      'not.exist'
    );
    cy.get('[data-e2e="answer-option-variable-name-warning-icon"]').should(
      'not.exist'
    );
  });

  it('should show errors when redeclaring variable names', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    // input questionnaire settings
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains(study.name).click();

    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Test Fragebogen', { force: true });
    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();
    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    // open first question and add variable name
    cy.get(
      '[data-e2e="question-list-item"]:nth-child(1) [role="button"]'
    ).click();

    cy.get(
      '[data-e2e="question-list-item"]:nth-child(1) [data-e2e="question-variable-name-input"]'
    )
      .focus()
      .type('Variable A');

    // create and open second question and add variable name
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();

    cy.get(
      '[data-e2e="question-list-item"]:nth-child(2) [role="button"]'
    ).click();

    cy.get(
      '[data-e2e="question-list-item"]:nth-child(2) [data-e2e="question-variable-name-input"]'
    )
      .focus()
      .type('Variable B');

    cy.get('[data-e2e="question-redeclared-variable-name-error"]').should(
      'not.exist'
    );

    cy.get(
      '[data-e2e="question-list-item"]:nth-child(1) [data-e2e="question-variable-name-input"]'
    )
      .focus()
      .type('{backspace}B');

    cy.get('[data-e2e="question-redeclared-variable-name-error"]').should(
      'have.length',
      2
    );
  });

  // This test works only in chromium and headless. Does not work on Firefox,
  // because it does not start downloading file immediately but ask if you want to open it or download
  it('should export questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Export this questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('What is your name?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Freitext').click();

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

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    cy.get('[data-e2e="e2e-import-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-file-input"]').attachFile(
      'questionnnaire_for_importing.json'
    );

    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains(study.name).click();

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

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .contains('Frage : Where are you from?')
      .should('exist');
  });

  it('should test filter functionality', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create first questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('First Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();

    getExpansionPanel(0).then((elm) => {
      elm()
        .find('[data-e2e="e2e-question-text-input"]')
        .focus()
        .type('What is your name?');
      elm().find('[data-e2e="e2e-answer-type-select-dropdown"]').click();
      cy.get('[data-e2e="option"]').contains('Freitext').click();
    });

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create second questionnaire
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Second Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    getExpansionPanel(0).then((elm) => {
      elm().find('mat-expansion-panel-header').first().click();
      elm()
        .find('[data-e2e="e2e-question-text-input"]')
        .focus()
        .type('Where are you from?');
      elm().find('[data-e2e="e2e-answer-type-select-dropdown"]').click();
      cy.get('[data-e2e="option"]').contains('Freitext').click();
    });

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Create third questionnaire
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Third Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    getExpansionPanel(0).then((elm) => {
      elm().find('mat-expansion-panel-header').first().click();
      elm()
        .find('[data-e2e="e2e-question-text-input"]')
        .focus()
        .type('How old are you?');
      elm().find('[data-e2e="e2e-answer-type-select-dropdown"]').click();
      cy.get('[data-e2e="option"]').contains('Numerisch').click();
    });

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    //
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Check if all 3 questionnaires listed
    cy.get('[data-e2e="e2e-questionnaire-name"]').should('have.length', 3);
    cy.get('[data-e2e="e2e-filter-questionnaires-input"]')
      .focus()
      .type('Second');
    cy.get('[data-e2e="e2e-questionnaire-name"]').should('have.length', 1);
    cy.get('[data-e2e="e2e-questionnaire-name"]')
      .contains('Second Questionnaire')
      .should('exist');
  });
  it('should create new version of questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Sample Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Where are you from?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Freitext').click();

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

  it('should test versioning for singular questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Questionnaire Version 1', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('How old are you?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Numerisch').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-questionnaire-name"]').click();
    cy.get('[data-e2e="e2e-input-type-number"]')
      .find('input')
      .focus()
      .type('42');
    cy.get('p').contains('How old are you?').should('exist');
    cy.get('[data-e2e="e2e-save-questionnaire-and-exit"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();
    cy.get('#confirmButton').click();
    expectLocation(probandAuthFormUrl);

    // Login as forscher
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();
    cy.get('[data-e2e="e2e-study-name"]')
      .contains(study.name)
      .parent()
      .find('#editicon')
      .click();

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .contains('Frage : How old are you?')
      .parent()
      .click();

    // Delete question
    cy.get('[data-e2e="e2e-remove-question-button"]').click();
    // Add new question
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();

    cy.get('[data-e2e="e2e-question-expansion-panel"]').first().click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .first()
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Are you over 18');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .first()
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Einzelauswahl').click();

    cy.get('mat-form-field:has(label:contains("Wert 1"))')
      .find('input')
      .focus()
      .type('Yes');
    cy.get('mat-form-field:has(label:contains("Code 1"))')
      .find('input')
      .focus()
      .type('0');
    cy.get('mat-form-field:has(label:contains("Wert 2"))')
      .find('input')
      .focus()
      .type('No');
    cy.get('mat-form-field:has(label:contains("Code 2"))')
      .find('input')
      .focus()
      .type('1');

    // Update questionnaire Version
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband
    cy.visit(probandAppUrl);
    login(probandCredentials.username, newPassword);

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
    expectLocation(probandAuthFormUrl);

    const proband1 = generateRandomProbandForStudy();

    // Fresh created proband should see the Version 2 of the questionnaire
    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband1.pseudonym, token);
        createProband(proband1, study.name, token);
        return getCredentialsForProbandByUsername(proband1.pseudonym, token);
      })
      .then((cred) => {
        login(cred.username, cred.password);
        changePassword(cred.password, newPassword);

        cy.get('[data-e2e="e2e-sidenav-content"]')
          .contains('Fragebögen')
          .click();

        cy.get('[data-e2e="e2e-questionnaire-name"]').click();
        cy.get('[data-e2e="e2e-navigation-button"]').click();

        cy.get('[data-e2e="e2e-questionnaire-list"]')
          .contains('Are you over 18')
          .click();

        cy.get('[data-e2e="e2e-input-type-single-select"]')
          .contains('Yes')
          .click();

        // Release questionnaire
        cy.get('[data-e2e="e2e-swiper-button-next"]').click();
        cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
        cy.get('#confirmbutton').click();
      });
  });

  it.only('should test spontaneous questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create spontaneous questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();

    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Spontaneous Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Spontan').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Where are you from?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.get('[data-e2e="e2e-logout"]').click();

    // Login as Proband A
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-spontaneous-questionnaire-edit-button"]').click();

    // The version 1 should be shown
    cy.get('p').contains('Where are you from?').should('exist');
    cy.get('[data-e2e="e2e-input-type-text"]')
      .find('input')
      .focus()
      .type('Bonn');

    // Release questionnaire
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.logoutParticipant();

    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    cy.get('[data-e2e="e2e-study-name"]')
      .contains(study.name)
      .parent()
      .find('#editicon')
      .click();

    // Create new Version of questionnaire
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('mat-expansion-panel')
      .eq(0)
      .then((elm) => {
        cy.wrap(elm).find('mat-expansion-panel-header').click();
      });
    cy.get('#questiontextinput').clear().type('What is your name?');

    // Update questionnaire Version
    cy.get('[data-e2e="e2e-questionnaire-revise-button"]').click();
    cy.get('#confirmbutton').click();

    // Logout
    cy.logoutProfessional();

    // Login as Proband A
    cy.visit(probandAppUrl);
    login(probandCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-spontaneous-questionnaire-edit-button"]').click();

    cy.get('[data-e2e="e2e-input-type-text"]')
      .find('input')
      .focus()
      .type('Johny');
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

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-spontaneous-questionnaire-edit-button"]').click();

    cy.get('[data-e2e="e2e-input-type-text"]')
      .find('input')
      .focus()
      .type('Johny');
    cy.get('p').contains('What is your name?').should('exist');

    // Release questionnaire
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('[data-e2e="e2e-release-questionnaire-1-button"]').click();
    cy.get('#confirmbutton').click();
  });

  it('should update a questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample question
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Sample Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    // Add Free text
    cy.get('#mat-expansion-panel-header-0').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Where are you from?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Freitext').click();

    // Add Numerical answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-1').click();
    cy.get('#cdk-accordion-child-1')
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('How old are you?');
    cy.get('#cdk-accordion-child-1')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Numerisch').click();

    // Add multiple answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('#mat-expansion-panel-header-2').click();
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('What are your symptoms?');
    cy.get('#cdk-accordion-child-2')
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Mehrfach').click();

    cy.get('mat-form-field:has(label:contains("Wert 1"))')
      .find('input')
      .clear();
    cy.get('mat-form-field:has(label:contains("Wert 1"))')
      .find('input')
      .type('Yes');
    cy.get('mat-form-field:has(label:contains("Code 1"))')
      .find('input')
      .type('0');
    cy.get('mat-form-field:has(label:contains("Wert 2"))')
      .find('input')
      .type('No');
    cy.get('mat-form-field:has(label:contains("Code 2"))')
      .find('input')
      .type('1');
    cy.get('mat-form-field:has(label:contains("Wert 3"))')
      .find('input')
      .type('No');
    cy.get('mat-form-field:has(label:contains("Code 3"))')
      .find('input')
      .type('2');

    // Add multiple answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(3)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(3)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('What is a gender?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(3)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Einzelauswahl').click();

    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(3)
      .find('mat-form-field:has(label:contains("Wert 1"))')
      .find('input')
      .focus()
      .type('Male');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(3)
      .find('mat-form-field:has(label:contains("Code 1"))')
      .find('input')
      .focus()
      .type('0');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(3)
      .find('mat-form-field:has(label:contains("Wert 2"))')
      .find('input')
      .focus()
      .type('Female');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(3)
      .find('mat-form-field:has(label:contains("Code 2"))')
      .find('input')
      .focus()
      .type('1');

    // Add datum answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(4)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(4)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('When is your birthday?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(4)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Datum').click();

    // Add probe answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(5)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(5)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Pleas scan the probe');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(5)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Probe').click();

    // Add PZN answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(6)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(6)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('PZN');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(6)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('PZN').click();

    // Add Foto answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(7)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(7)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Please upload your Photo');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(7)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Foto').click();

    // Add Zeitstempel answer
    cy.get('[data-e2e="e2e-add-new-question-button"]').click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .eq(8)
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(8)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Please add Timestamp');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(8)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Zeitstempel').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="question-list"]').find('li').should('have.length', 9);
  });

  it('should deactivate a questionnaire', () => {
    cy.visit(adminAppUrl);
    login(forscherCredentials.username, forscherCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Verwaltung').click();

    // Create sample questionnaire
    cy.get('[data-e2e="e2e-create-new-questionnaire-button"]').click();
    cy.get('[data-e2e="e2e-select-study-dropdown"]').click();

    cy.get('[data-e2e="option"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-questionnaire-name-input"]')
      .focus()
      .type('Sample Questionnaire', { force: true });

    cy.get('[data-e2e="e2e-questionnaire-type-select"]').click();
    cy.get('[data-e2e="option"]').contains('Für Teilnehmende').click();
    cy.get('[data-e2e="e2e-cycle-unit-select-dropdown"]').click();
    cy.get('[data-e2e="option"]').contains('Einmal').click();

    cy.get('[data-e2e="e2e-activate-after-days-input"]').focus().type('0');
    cy.get('[data-e2e="e2e-notification-tries"]').focus().type('0');

    cy.get(' [data-e2e="e2e-question-expansion-panel"] > [role="button"]')
      .first()
      .parent()
      .click();
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-question-text-input"]')
      .focus()
      .type('Where are you from?');
    cy.get('[data-e2e="e2e-question-expansion-panel"] > [role="region"]')
      .eq(0)
      .find('[data-e2e="e2e-answer-type-select-dropdown"]')
      .click();
    cy.get('[data-e2e="option"]').contains('Freitext').click();

    cy.get('[data-e2e="e2e-save-questionnaire-button"]').click();
    cy.get('#confirmbutton').click();

    // In slower environments like in CI, we need to wait for the save request
    // to be done and for angular to actually know about the study
    // name in its component. As we have no way to know when the component is
    // ready, we additionally wait an arbitrary amount of time.
    cy.wait('@saveQuestionnaire');
    cy.wait(3000);

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
