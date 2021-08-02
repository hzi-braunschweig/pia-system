/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fetchPasswordForUserFromMailHog } from '../../../support/user.commands';
import {
  changePassword,
  createConsentForStudy,
  createPlannedProband,
  createProband,
  createStudy,
  createUser,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  getToken,
  login,
} from '../../../support/commands';

const short = require('short-uuid');
const translator = short();

let study;
let anotherTestStudy;
let proband;
let ut;
let pm;
let forscher;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Proband", Tab: Contact', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    anotherTestStudy = generateRandomStudy();
    proband = generateRandomProbandForStudy(study.name);
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [
        { study_id: study.name, access_level: 'admin' },
        { study_id: anotherTestStudy.name, access_level: 'admin' },
      ],
    };

    createStudy(study)
      .then(() => createStudy(anotherTestStudy))
      .then(() => createUser(ut))
      .then(() => createUser(pm))
      .then(() => createUser(forscher))
      .then(() => getToken(ut.username))
      .then((token) => createPlannedProband(proband.pseudonym, token))
      .then(() => getToken(ut.username))
      .then((token) => createProband(proband, token))
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(proband.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      });
  });

  it('it should display message "Derzeit sind keine Kontaktinformationen für diese Studie verfügbar."', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Kontakt').click();
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
      getToken(forscher.username).then((token) =>
        createConsentForStudy(testProbandConsent, study.name, token)
      );
    });

    it('should test button "Neues Nasenabstrich-Set zuschicken!"', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
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

      cy.get('[data-e2e="e2e-sidenav-content"]').contains('Kontakt').click();

      cy.get('[data-e2e="request-new-material-button"]').click();
      cy.get('#mat-dialog-1').contains('Ja').click();
      cy.get('#confirmbutton').click();

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]').contains('Abmelden').click();
      cy.get('#confirmButton').click();
      cy.get('#changeaccount').click();

      fetchPasswordForUserFromMailHog(pm.username).then((userCredentials) => {
        login(pm.username, userCredentials.password);
        changePassword(userCredentials.password, newPassword);
        cy.get('[data-e2e="e2e-sidenav-content"]').click();

        cy.get('[data-e2e="e2e-sidenav-content"]')
          .contains('Probenverwaltung')
          .click();

        cy.get('[data-e2e="e2e-sample-management-component"]').click();

        cy.get('[data-e2e="e2e-sample-management-component"]')
          .contains('mat-icon', 'priority_high')
          .should('be.visible');
      });
    });
  });
});
