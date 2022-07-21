/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  changePassword,
  createConsentForStudy,
  createPlannedProband,
  createProband,
  createStudy,
  createUser,
  createWelcomeText,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
  updateProbandData,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';
import {
  createProfessionalUser,
  loginProfessional,
  UserCredentials,
} from 'cypress/support/user.commands';

const short = require('short-uuid');
const translator = short();

let study;
let proband: CreateProbandRequest;
let ut;
let pm;
let forscher;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Proband", Tab: Home', () => {
  beforeEach(() => {
    study = generateRandomStudy();
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
      study_accesses: [],
    };

    createStudy(study);

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

    cy.get<UserCredentials>('@pmCred')
      .then(loginProfessional)
      .then((token) => {
        updateProbandData(
          proband.pseudonym,
          {
            email: `${proband.pseudonym}@testpia-app.de`,
            haus_nr: '76',
            plz: '53117',
          },
          token
        );
      });
  });

  describe('Consent text', () => {
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

    it('should be displayed', () => {
      cy.visit(appUrl);

      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);

      // User name should be displayed
      cy.get('[data-e2e="e2e-username"]').contains(probandCredentials.username);

      // User Role should be displayed
      cy.get('[data-e2e="e2e-current-role"]').contains('Teilnehmer:in');

      // data-e2e="e2e-compliance-edit-component"
      cy.get('[data-e2e="e2e-compliance-probands-content"]')
        .contains('Einwilligung')
        .click();

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
      cy.expectPathname('/home');

      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einwilligung')
        .click();
      cy.get('[data-e2e="e2e-compliance-edit-component-header"]')
        .contains(study.name)
        .click();
    });
  });

  describe('', () => {
    const welcomeText = {
      welcome_text:
        'Lieber **PIA-Nutzer**,\nliebe **PIA-Nutzerin**,\n\nwir freuen uns auf Ihre Eingaben!',
    };

    beforeEach(() => {
      cy.get<UserCredentials>('@fCred')
        .then(loginProfessional)
        .then((token) => createWelcomeText(welcomeText, study.name, token));
    });

    it('Welcome text should be available and part of the study', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.expectPathname('/home');
      cy.get('[data-e2e="e2e-home-content"]').contains(
        'Lieber PIA-Nutzer, liebe PIA-Nutzerin, wir freuen uns auf Ihre Eingaben!'
      );
    });

    it('should have store buttons for Android und iOS', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-android-link"]');
      cy.get('[data-e2e="e2e-iOS-link"]');
    });

    it('Android und iOS store links should work', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-android-link"]').click();
      cy.get('[data-e2e="e2e-iOS-link"]').click();
    });

    it('should visually check the start page and correct menu items should be available', () => {
      cy.visit(appUrl);
      login(probandCredentials.username, probandCredentials.password);
      changePassword(probandCredentials.password, newPassword);
      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();
      cy.expectPathname('/questionnaires/user');

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Einstellungen')
        .click();
      cy.expectPathname('/settings');

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]').contains('Kontakt').click();
      cy.expectPathname('/contact');

      cy.get('[data-e2e="e2e-sidenav-content"]').click();
      cy.get('[data-e2e="e2e-sidenav-content"]').contains('Startseite').click();
      cy.expectPathname('/home');
    });
  });
});
