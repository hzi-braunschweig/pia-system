/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createProfessionalUser,
  loginProfessional,
  UserCredentials,
} from '../../../support/user.commands';
import {
  changePassword,
  createConsentForStudy,
  createPlannedProband,
  createProband,
  createStudy,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';

const short = require('short-uuid');
const translator = short();

let study;
let anotherTestStudy;
let proband: CreateProbandRequest;
let ut;
let pm;
let forscher;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const probandAppUrl = '/';
const adminAppUrl = '/admin/';

describe('Release Test, role: "Proband", Tab: Contact', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    anotherTestStudy = generateRandomStudy();
    proband = generateRandomProbandForStudy();
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [],
    };

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [
        { study_id: anotherTestStudy.name, access_level: 'admin' },
      ],
    };

    createStudy(study);
    createStudy(anotherTestStudy);

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
      });
  });

  it('it should display message "Derzeit sind keine Kontaktinformationen für diese Studie verfügbar."', () => {
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.contains('[data-e2e="e2e-sidenav-content"]', 'Kontakt')
      .contains('Kontakt')
      .click();
    cy.expectPathname('/contact');

    cy.get('[data-e2e="e2e-contact-content"]').contains('Kontakt');
    cy.get('[data-e2e="e2e-contact-content"]').contains(
      'Derzeit sind keine Kontaktinformationen für diese Studie verfügbar.'
    );
  });
  describe('Consent for nasal swab is present', () => {
    const testProbandConsent = {
      to_be_filled_by: 'Proband',
      compliance_text:
        '<pia-consent-input-text-lastname></pia-consent-input-text-lastname>\n<pia-consent-input-text-firstname></pia-consent-input-text-firstname>\n\nIch williger ein meine Proben zu verwalten\n<pia-consent-input-radio-samples></pia-consent-input-radio-samples>\n\nIch williger ein meine Laborergebnisse zu verwalten\n<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\n\nIch williger ein meine Blut Proben zu verwalten\n<pia-consent-input-radio-bloodsamples></pia-consent-input-radio-bloodsamples>\n\nIch willige in die Verarbeitung und Nutzung meiner personenbezogenen Daten gemäß der vorstehenden Datenschutzerklärung ein.\n<pia-consent-input-radio-app></pia-consent-input-radio-app>\n',
    };

    beforeEach(() => {
      cy.get<UserCredentials>('@fCred')
        .then(loginProfessional)
        .then((token) =>
          createConsentForStudy(testProbandConsent, study.name, token)
        );
    });

    it('should test button "Neues Nasenabstrich-Set zuschicken!"', () => {
      cy.visit(probandAppUrl);

      cy.intercept({
        method: 'GET',
        url: `/api/v1/compliance/${study.name}/text`,
      }).as('getText');

      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);

      cy.wait('@getText');

      cy.get('[data-e2e="e2e-sidenav-content"]').click();

      cy.get('[data-e2e="e2e-consent-name-lastname"]')
        .find('input')
        .type('John');
      cy.get('[data-e2e="e2e-consent-name-firstname"]')
        .find('input')
        .type('Doe');

      cy.get('[data-e2e="e2e-consent-name-samples"]')
        .find('mat-radio-button')
        .contains('Ja')
        .click();
      cy.get('[data-e2e="e2e-consent-name-labresults"]')
        .find('mat-radio-button')
        .contains('Ja')
        .click();
      cy.get('[data-e2e="e2e-consent-name-bloodsamples"]')
        .find('mat-radio-button')
        .contains('Ja')
        .click();
      cy.get('[data-e2e="e2e-consent-name-app"]')
        .find('mat-radio-button')
        .contains('Ja')
        .click();

      cy.get('[data-e2e="e2e-compliance-edit-ok-button"]').click();
      cy.get('#confirmbutton').click();

      // necessary wait, otherwise the side menu rerenders and the element is - in some circumstances - not clickable anymore
      cy.contains('[data-e2e="e2e-sidenav-content"]', 'Laborergebnisse');
      cy.contains('[data-e2e="e2e-sidenav-content"]', 'Kontakt')
        .contains('Kontakt')
        .click();

      cy.get('[data-e2e="request-new-material-button"]').click();
      cy.get('#mat-dialog-1').contains('Ja').click();
      cy.get('#confirmbutton').click();

      // necessary wait, otherwise the side menu rerenders and the element is  - in some circumstances - not clickable anymore
      cy.contains('[data-e2e="e2e-sidenav-content"]', 'Laborergebnisse');
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.contains('[data-e2e="e2e-sidenav-content"]', 'Abmelden')
        .contains('Abmelden')
        .click();
      cy.get('#confirmButton').click();

      cy.get<UserCredentials>('@pmCred').then((cred) => {
        cy.visit(adminAppUrl);
        login(cred.username, cred.password);

        cy.get('[data-e2e="e2e-sidenav-content"]').click();

        cy.contains('[data-e2e="e2e-sidenav-content"]', 'Probenverwaltung')
          .contains('Probenverwaltung')
          .click();

        cy.get('[data-e2e="e2e-sample-management-study-select"]').click();
        cy.get('.mat-option-text').contains(study.name).click();

        cy.get('[data-e2e="e2e-sample-management-component"]').click();

        cy.get('[data-e2e="e2e-sample-management-component"]')
          .contains('mat-icon', 'priority_high')
          .should('be.visible');
      });
    });
  });
});
