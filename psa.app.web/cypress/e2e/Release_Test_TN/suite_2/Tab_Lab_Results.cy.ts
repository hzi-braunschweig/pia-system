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

const testProbandConsent = {
  to_be_filled_by: 'Proband',
  compliance_text:
    '<pia-consent-input-text-lastname></pia-consent-input-text-lastname>\n<pia-consent-input-text-firstname></pia-consent-input-text-firstname>\n\nIch williger ein meine Proben zu verwalten\n<pia-consent-input-radio-samples></pia-consent-input-radio-samples>\n\nIch williger ein meine Laborergebnisse zu verwalten\n<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\n\nIch williger ein meine Blut Proben zu verwalten\n<pia-consent-input-radio-bloodsamples></pia-consent-input-radio-bloodsamples>\n\nIch willige in die Verarbeitung und Nutzung meiner personenbezogenen Daten gemäß der vorstehenden Datenschutzerklärung ein.\n<pia-consent-input-radio-app></pia-consent-input-radio-app>\n',
};
const appUrl = '/';

describe('Release Test, role: "Proband", Tab: Lab Results', () => {
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

    cy.get<UserCredentials>('@fCred')
      .then(loginProfessional)
      .then((token) => {
        createConsentForStudy(testProbandConsent, study.name, token);
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

  it('should display "Es stehen Ihnen keine Laborergebnisse zur Verfügung"', () => {
    cy.visit(appUrl);

    cy.intercept({
      method: 'GET',
      url: `/api/v1/compliance/${study.name}/text`,
    }).as('getText');

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.wait('@getText');

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

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

    cy.contains('[data-e2e="e2e-sidenav-content"]', 'Laborergebnisse')
      .contains('Laborergebnisse')
      .click();

    cy.get('[data-e2e="e2e-laboratory-results-component"]')
      .contains('Es stehen Ihnen keine Laborergebnisse zur Verfügung')
      .should('be.visible');
  });
  it('should not display "Lab Results" tab', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Laborergebnisse')
      .should('not.exist');
  });

  it('should test laboratory results format', () => {
    cy.visit(appUrl);

    cy.intercept({
      method: 'GET',
      url: `/api/v1/compliance/${study.name}/text`,
    }).as('getText');

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.wait('@getText');
    cy.get('[data-e2e="e2e-sidenav-content"]').click();

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
      .contains('Laborergebnisse')
      .click();
  });
});
