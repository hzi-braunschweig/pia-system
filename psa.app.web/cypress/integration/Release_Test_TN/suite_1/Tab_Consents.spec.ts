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
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
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
let forscher;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const testProbandConsent = {
  to_be_filled_by: 'Proband',
  compliance_text:
    '<pia-consent-input-text-lastname></pia-consent-input-text-lastname>\n<pia-consent-input-text-firstname></pia-consent-input-text-firstname>\n\nIch williger ein meine Proben zu verwalten\n<pia-consent-input-radio-samples></pia-consent-input-radio-samples>\n\nIch williger ein meine Laborergebnisse zu verwalten\n<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\n\nIch williger ein meine Blut Proben zu verwalten\n<pia-consent-input-radio-bloodsamples></pia-consent-input-radio-bloodsamples>\n\nIch willige in die Verarbeitung und Nutzung meiner personenbezogenen Daten gemäß der vorstehenden Datenschutzerklärung ein.\n<pia-consent-input-radio-app></pia-consent-input-radio-app>\n',
};

const adminAppUrl = '/admin/';
const probandAppUrl = '/';

describe('Vorlage_test_TN_web_210127 -> release_test_TN_web -> Reiter: Einwilligungen', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    proband = generateRandomProbandForStudy();
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
    };

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
    };

    createStudy(study);

    createProfessionalUser(ut, study.name).as('utCred');
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

    cy.get<UserCredentials>('@fCred')
      .then(loginProfessional)
      .then((token) =>
        createConsentForStudy(testProbandConsent, study.name, token)
      );
  });

  it('Ohne Zustimmung zur App-Nutzung darf Appnutzung nicht möglich sein', () => {
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.expectPathname('/compliance/agree');
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Startseite').click();
    cy.expectPathname('/compliance/agree');
    cy.get('[da' + '' + 'ta-e2e="e2e-sidenav-content"]')
      .contains('Fragebögen')
      .click();
    cy.expectPathname('/compliance/agree');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einstellungen')
      .click();
    cy.expectPathname('/compliance/agree');
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Kontakt').click();
    cy.expectPathname('/compliance/agree');
  });

  it('Prüfen, ob nur Buttons vorhanden sind, die dort sein dürfen', () => {
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .find('[data-e2e="e2e-compliance-edit-component-header"]')
      .contains(study.name);
    cy.get('[data-e2e="e2e-consent-name-lastname"]')
      .find('label')
      .contains('Nachname')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-lastname"]').find('input').type('Doe');
    cy.get('[data-e2e="e2e-consent-name-firstname"]')
      .find('label')
      .contains('Vorname')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-firstname"]')
      .find('input')
      .type('John');

    cy.get('[data-e2e="e2e-consent-name-samples"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible')
      .click();
    cy.get('[data-e2e="e2e-consent-name-labresults"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible')
      .click();
    cy.get('[data-e2e="e2e-consent-name-bloodsamples"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible')
      .click();
    cy.get('[data-e2e="e2e-consent-name-app"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible')
      .click();

    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains('button', 'Als PDF herunterladen')
      .should('not.exist');

    cy.get('[data-e2e="e2e-compliance-edit-ok-button"]').click();
    cy.get('#confirmbutton').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();
    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains('button', 'Als PDF herunterladen')
      .should('be.visible');
  });

  it('Die Menüpunkte (z.B. Laborergebnisse) werden enstprechend der Einwilligung angezeigt bzw. nicht angezeigt.', () => {
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Laborergebnisse')
      .should('not.exist');

    cy.get('[data-e2e="e2e-consent-name-firstname"]')
      .find('input')
      .type('John');
    cy.get('[data-e2e="e2e-consent-name-lastname"]').find('input').type('Doe');

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

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Startseite')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Fragebögen')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Laborergebnisse')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einwilligung')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einstellungen')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Kontakt')
      .should('be.visible');
  });

  it('Bei Zustimmung: Einwilligungstext wird angezeigt', () => {
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-consent-name-lastname"]')
      .find('label')
      .contains('Nachname')
      .should('be.visible');

    cy.get('[data-e2e="e2e-consent-name-firstname"]')
      .find('label')
      .contains('Vorname')
      .should('be.visible');

    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains('Ich williger ein meine Proben zu verwalten')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-samples"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-samples"]')
      .find('mat-radio-button')
      .contains('Nein')
      .should('be.visible');

    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains('Ich williger ein meine Blut Proben zu verwalten')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-labresults"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-labresults"]')
      .find('mat-radio-button')
      .contains('Nein')
      .should('be.visible');

    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains('Ich williger ein meine Blut Proben zu verwalten')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-bloodsamples"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-bloodsamples"]')
      .find('mat-radio-button')
      .contains('Nein')
      .should('be.visible');

    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains(
        'Ich willige in die Verarbeitung und Nutzung meiner personenbezogenen Daten gemäß der vorstehenden Datenschutzerklärung ein.'
      )
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-app"]')
      .find('mat-radio-button')
      .contains('Ja')
      .should('be.visible');
    cy.get('[data-e2e="e2e-consent-name-app"]')
      .find('mat-radio-button')
      .contains('Nein')
      .should('be.visible');

    cy.get('[data-e2e="e2e-compliance-edit-ok-button"]').contains('OK');
  });

  it('Bei Zustimmung:  Einwilligung ist als PDF downloadbar', () => {
    cy.visit(probandAppUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-consent-name-lastname"]').find('input').type('Doe');
    cy.get('[data-e2e="e2e-consent-name-firstname"]')
      .find('input')
      .type('John');

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

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();
    cy.get('[data-e2e="e2e-compliance-edit-component"]')
      .contains('button', 'Als PDF herunterladen')
      .click();
  });
});
