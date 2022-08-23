/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createProfessionalUser,
  fetchPasswordForUserFromMailHog,
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
import { CreateProbandRequest } from '../../../src/app/psa.app.core/models/proband';

const short = require('short-uuid');
const translator = short();

let study;
let study2;
let study3;
let study4;
let someRandomAnotherStudy;
let forscher;
let proband: CreateProbandRequest;
let proband2: CreateProbandRequest;
let ut;
let pm;
const forscherCredentials = { username: '', password: '' };
const probandCredentials = { username: '', password: '' };
const utCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const adminAppUrl = '/admin/';
const probandAppUrl = '/';

describe('Release Test, role: "Forscher", General', () => {
  beforeEach(() => {
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
    proband2 = generateRandomProbandForStudy();

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
    createStudy(someRandomAnotherStudy)
      .then(() => createProfessionalUser(ut, study.name))
      .as('utCred')
      .then(() => createProfessionalUser(pm, study.name))
      .as('pmCred')

      .then(() => cy.get<UserCredentials>('@utCred'))
      .then((cred) => cy.loginProfessional(cred))
      .then((token) => createPlannedProband(proband.pseudonym, token))
      .then(() => cy.get<UserCredentials>('@utCred'))
      .then((cred) => cy.loginProfessional(cred))
      .then((token) => createProband(proband, study.name, token))
      .then(() => cy.get<UserCredentials>('@utCred'))
      .then((cred) => cy.loginProfessional(cred))
      .then((token) =>
        getCredentialsForProbandByUsername(proband.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      })
      .then(() => fetchPasswordForUserFromMailHog(ut.username))
      .then((cred) => {
        utCredentials.username = cred.username;
        utCredentials.password = cred.password;
      })
      .then(() => createProfessionalUser(forscher, study.name))
      .then((cred) => {
        forscherCredentials.username = cred.username;
        forscherCredentials.password = cred.password;
      })
      .then(() => {
        cy.visit(adminAppUrl);
        login(forscherCredentials.username, forscherCredentials.password);
      });
  });

  afterEach(() => {
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('.sidenav-top').click();
    cy.contains('Abmelden').click();
  });

  it('should contain exact 4 studies', () => {
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();

    cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
    cy.get('.mat-option-text')
      .should('have.length', 4)
      .contains(study.name)
      .click();
  });

  it('should has consent for "Proband" and "Untersuchungsteam" and should has 2 Studies without consents', () => {
    cy.fixture('consents.json').then((consents) => {
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      // create consent for tn
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();
      cy.get(
        '[data-e2e="e2e-compliance-researcher-proband-radio-button"]'
      ).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').click();

      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        consents.consent_tn,
        { delay: 0 }
      );

      cy.get('[data-e2e="e2e-compliance-researcher-publish-button"]')
        .should('not.be.disabled')
        .click();
      cy.get('#confirmbutton').click();

      // create consent for ut
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study2.name).click();
      cy.get('[data-e2e="e2e-compliance-researcher-ut-radio-button"]').click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').click();

      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        consents.consent_ut,
        { delay: 0 }
      );

      cy.get('[data-e2e="e2e-compliance-researcher-publish-button"]')
        .should('not.be.disabled')
        .click();
      cy.get('#confirmbutton').click();

      cy.contains('Abmelden').click();

      login(forscherCredentials.username, forscherCredentials.password);
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      // test consent for tn
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]')
        .invoke('val')
        .should('eq', consents.consent_tn);

      // test consent for tn
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study2.name).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]')
        .invoke('val')
        .should('eq', consents.consent_ut);

      // empty consent
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study3.name).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]')
        .invoke('val')
        .should('be.empty');

      // empty consent
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study4.name).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]')
        .invoke('val')
        .should('be.empty');
    });
  });

  it('should add new text field', () => {
    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();

    cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();

    cy.get('.mat-option-text').contains(study.name).click();

    cy.get('[data-e2e="e2e-label-new-textfield"]').type('Foo');
    cy.get('[data-e2e="e2e-placeholder-new-textfield"]').type('Bar');
    cy.get('[data-e2e="e2e-add-new-field-button"]').click();
    cy.get('[data-e2e="e2e-compliance-text-field-button"]')
      .contains('Foo (Bar)')
      .click();

    cy.contains('Abmelden').click();

    login(forscherCredentials.username, forscherCredentials.password);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();

    cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
    cy.get('.mat-option-text').contains(study.name).click();
    cy.get('[data-e2e="e2e-compliance-text-field-button"]')
      .contains('Foo (Bar)')
      .click();
  });

  it('should add "Einwilligungsfeld"', () => {
    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();

    cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();

    cy.get('.mat-option-text').contains(study.name).click();

    cy.get('[data-e2e="e2e-compliance-input"]').type('FooBar');
    cy.get('[data-e2e="e2e-add-compliance-button"]').click();
    cy.get('[ data-e2e="e2e-add-compliance-field-to-consent"]')
      .contains('FooBar')
      .should('be.visible');
  });

  it('create consent for tn, check that condition works and consent is correctly displayed to tn', () => {
    cy.fixture('consents.json').then((consents) => {
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      // create consent for tn
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();
      cy.get(
        '[data-e2e="e2e-compliance-researcher-proband-radio-button"]'
      ).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').click();

      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        consents.consent_tn,
        { delay: 0 }
      );

      cy.get('[data-e2e="e2e-compliance-researcher-publish-button"]')
        .should('not.be.disabled')
        .click();
      cy.get('#confirmbutton').click();

      cy.contains('Abmelden').click();

      cy.visit(probandAppUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-compliance-edit-component-header"]').contains(
        study.name
      );
      cy.get('[data-e2e="e2e-consent-generic-radio"]').contains('Nein').click();
      cy.get('[data-e2e="e2e-consent-name-app"]').contains('Ja').click();
      cy.get(':nth-child(16) > .radio-group-wrapper').contains('Ja').click();

      cy.get('[data-e2e="e2e-compliance-probands-content"]')
        .contains('Angaben der Kontaktperson:')
        .should('exist');

      cy.get('[data-e2e="e2e-consent-name-firstname"]').contains('Vorname');
      cy.get('[data-e2e="e2e-consent-name-firstname"]')
        .find('input')
        .type('Max');

      cy.get('[data-e2e="e2e-consent-name-lastname"]').contains('Nachname');
      cy.get('[data-e2e="e2e-consent-name-lastname"]')
        .find('input')
        .type('Mustermann');

      cy.get('[data-e2e="e2e-consent-email-input"]').contains('E-Mail');
      cy.get('[data-e2e="e2e-consent-email-input"]')
        .find('input')
        .type('max.mustermann@pia-test.de');

      cy.get('[data-e2e="e2e-consent-name-birthdate"]').contains('Geburtstag');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]')
        .find('input')
        .type('2/14/1985');

      cy.get('[data-e2e="e2e-consent-generic-radio"]').contains('Ja').click();

      cy.get('[data-e2e="e2e-compliance-probands-content"]')
        .contains('Angaben der Person für die ich personenberechtigt bin:')
        .should('exist');

      cy.get('[data-e2e="e2e-consent-name-firstname"]').find('input').clear();
      cy.get('[data-e2e="e2e-consent-name-lastname"]').find('input').clear();
      cy.get('[data-e2e="e2e-consent-name-birthdate"]').find('input').clear();
      cy.get('[data-e2e="e2e-consent-name-firstname"]').contains('Vorname');
      cy.get('[data-e2e="e2e-consent-name-lastname"]').contains('Nachname');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]').contains('Geburtstag');

      cy.get('[data-e2e="e2e-consent-name-firstname"]')
        .find('input')
        .type('Test');
      cy.get('[data-e2e="e2e-consent-name-lastname"]')
        .find('input')
        .type('TestLastname');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]')
        .find('input')
        .type('3/15/1975');
      cy.get('[data-e2e="e2e-consent-email-input"]').should('not.exist');
    });
  });

  it('create consent for ut, check that condition works and consent is correctly displayed to tn', () => {
    cy.fixture('consents.json').then((consents) => {
      cy.intercept({
        method: 'GET',
        url: `/admin/api/v1/compliance/${study.name}/text/edit`,
      }).as('getTextEdit');

      cy.intercept({
        method: 'GET',
        url: `/admin/api/v1/compliance/${study.name}/questionnaire-placeholder`,
      }).as('getQuestionnairePlaceholder');

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      // create consent for ut
      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();

      // Wait to make sure the compliance texts are fetched from the backend
      cy.wait('@getTextEdit');
      cy.wait('@getQuestionnairePlaceholder');

      cy.get('[data-e2e="e2e-compliance-researcher-ut-radio-button"]').click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').click();

      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        consents.consent_ut,
        { delay: 0 }
      );

      cy.get('[data-e2e="e2e-compliance-researcher-publish-button"]')
        .should('not.be.disabled')
        .click();

      cy.get('#confirmbutton').click();

      cy.contains('Abmelden').click();

      login(utCredentials.username, utCredentials.password);

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligungsmanagement')
        .click();

      cy.get('[data-e2e="e2e-compliance-management-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();

      cy.get('[data-e2e="e2e-compliance-management-study"]')
        .contains(study.name)
        .should('exist');
      cy.get(
        '[data-e2e="e2e-compliance-management-show-consent-button"]'
      ).click();

      cy.get('[data-e2e="e2e-consent-name-app"]').contains('Ja').click();

      cy.get('[data-e2e="child"]').contains('Nein').click();
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('Consent for me')
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('My firstname:')
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('My lastname:')
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('My birthdate:')
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('Consent for my child')
        .should('not.exist');

      cy.get('[data-e2e="child"]').contains('Ja').click();
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('Consent for me')
        .should('not.exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains('Consent for my child')
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains("The child's firstname:")
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains("The child's lastname:")
        .should('exist');
      cy.get('[data-e2e="e2e-compliance-edit-component"]')
        .contains("The child's birthdate:")
        .should('exist');

      cy.get('[data-e2e="e2e-consent-name-labresults"]')
        .contains('Nein')
        .click();
      cy.get('[data-e2e="e2e-pia-consent-switch-radio-generic"]')
        .contains('Just a hint :)')
        .should('not.exist');
      cy.get('[data-e2e="e2e-consent-name-labresults"]').contains('Ja').click();
      cy.get('[data-e2e="e2e-pia-consent-switch-radio-generic"]')
        .contains('Just a hint :)')
        .should('exist');

      cy.get('[data-e2e="e2e-consent-name-samples"]').contains('Ja').click();
      cy.get('[data-e2e="spontaneous"]').contains('Ja').click();
      cy.get('[data-e2e="evaluation"]').contains('Ja').click();

      cy.get('[data-e2e="e2e-consent-name-firstname"]').contains('Vorname');
      cy.get('[data-e2e="e2e-consent-name-firstname"]')
        .find('input')
        .type('Max');

      cy.get('[data-e2e="e2e-consent-name-lastname"]').contains('Nachname');
      cy.get('[data-e2e="e2e-consent-name-lastname"]')
        .find('input')
        .type('Mustermann');

      cy.get('[data-e2e="e2e-consent-name-birthdate"]').contains('Geburtstag');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]')
        .find('input')
        .type('2/14/1985');

      cy.get('[groupname="textGeneric"]').find('input').type('Burgstraße 69');
      cy.get('[consentname="location"]').find('input').type('53177 Bonn');

      cy.get('.mat-dialog-actions').contains('Schließen').click();
    });
  });

  it('test preview function', () => {
    cy.fixture('consents.json').then((consents) => {
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();
      cy.get('[data-e2e="e2e-compliance-researcher-ut-radio-button"]').click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').click();

      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        consents.consent_tn,
        { delay: 0 }
      );
      cy.get('[data-e2e="e2e-compliance-researcher-preview-button"]').click();

      cy.get('[data-e2e="e2e-consent-name-firstname"]').should('not.exist');
      cy.get('[data-e2e="e2e-consent-name-lastname"]').should('not.exist');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]').should('not.exist');
      cy.get('[data-e2e="e2e-consent-email-input"]').should('not.exist');

      cy.get('[data-e2e="child"]').contains('Ja').click();
      cy.get('[data-e2e="e2e-consent-name-firstname"]')
        .find('input')
        .should('exist');
      cy.get('[data-e2e="e2e-consent-name-lastname"]')
        .find('input')
        .should('exist');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]')
        .find('input')
        .should('exist');
      cy.get('[data-e2e="e2e-consent-email-input"]').should('not.exist');

      cy.get('[data-e2e="child"]').contains('Nein').click();
      cy.get('[data-e2e="e2e-consent-name-firstname"]')
        .find('input')
        .should('exist');
      cy.get('[data-e2e="e2e-consent-name-lastname"]')
        .find('input')
        .should('exist');
      cy.get('[data-e2e="e2e-consent-name-birthdate"]')
        .find('input')
        .should('exist');
      cy.get('[data-e2e="e2e-consent-email-input"]')
        .find('input')
        .should('exist');

      cy.get('[data-e2e="app"]').contains('Ja').click();
      cy.get('[data-e2e="Wissenschaft"]').contains('Ja').click();
    });
  });

  it('should test changing functionality', () => {
    cy.fixture('consents.json').then((consents) => {
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();
      cy.get(
        '[data-e2e="e2e-compliance-researcher-proband-radio-button"]'
      ).click();
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').click();

      cy.get('[data-e2e="e2e-compliance-researcher-component"]')
        .find('textarea')
        .invoke('val', consents.consent_tn);

      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        ' ',
        { delay: 0 }
      );

      cy.get('[data-e2e="e2e-compliance-researcher-publish-button"]')
        .should('not.be.disabled')
        .click();
      cy.get('#confirmbutton').click();

      cy.contains('Abmelden').click();

      cy.visit(probandAppUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);

      cy.get('[data-e2e="child"').should('exist');
      cy.get('[data-e2e="app"').should('exist');
      cy.get('[data-e2e="Wissenschaft"').should('exist');

      cy.contains('Abmelden').click();
      cy.get('#confirmButton').click();

      cy.visit(adminAppUrl);
      login(forscherCredentials.username, forscherCredentials.password);

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();

      cy.get('[data-e2e="e2e-setup-compliance-study-select"]').click();
      cy.get('.mat-option-text').contains(study.name).click();

      // wait for the form to be initialized with the current compliance text
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').should(
        ($input) =>
          expect($input.val()).to.include(consents.consent_tn.slice(2, 89))
      );
      // prevent "failed because the center of this element is hidden from view" error
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').invoke(
        'val',
        ''
      );
      cy.get('[data-e2e="e2e-compliance-researcher-compliance-text"]').type(
        consents.consent_tn_less,
        { delay: 0 }
      );

      cy.get('[data-e2e="e2e-compliance-researcher-publish-button"]')
        .should('not.be.disabled')
        .click();
      cy.get('#confirmbutton').click();

      cy.contains('Abmelden').click();

      cy.visit(probandAppUrl);

      cy.get('[data-e2e="child"').should('exist');
      cy.get('[data-e2e="app"').should('exist');
      cy.get('[data-e2e="Wissenschaft"').should('not.exist');
    });
  });
});
