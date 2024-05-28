/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ProfessionalUser,
  UserCredentials,
  createProfessionalUser,
  loginProfessional,
} from '../../support/user.commands';
import {
  RandomStudy,
  changePassword,
  createConsentForStudy,
  createPlannedProband,
  createProband,
  createStudy,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
  logout,
} from '../../support/commands';

import short from 'short-uuid';
import path from 'path';
import JSZip from 'jszip';
import { CreateProbandRequest } from 'src/app/psa.app.core/models/proband';
import {
  ADMIN_APP_URL,
  PROBAND_APP_URL,
  VALID_TEST_PASSWORD,
} from 'cypress/support/constants';

const translator = short();

let study: RandomStudy;
let ewManager: ProfessionalUser;
let ut: ProfessionalUser;
let forscher: ProfessionalUser;
let proband: CreateProbandRequest;

let ewCredentials: UserCredentials;
let forscherCredentials: UserCredentials;
let probandCredentials: UserCredentials;

const probandConsent = {
  to_be_filled_by: 'Proband',
  compliance_text:
    'Vorname: \n<pia-consent-input-text-firstname></pia-consent-input-text-firstname>\nNachname: \n<pia-consent-input-text-lastname></pia-consent-input-text-lastname>\nGeburtsdatum: \n<pia-consent-input-text-birthdate></pia-consent-input-text-birthdate>\nAdresse: \n<pia-consent-input-text-location></pia-consent-input-text-location>\nDatum:\n<pia-consent-input-text-date></pia-consent-input-text-date>\nApp-Nutzung: \n<pia-consent-input-radio-app></pia-consent-input-radio-app>\nBloodsamples: \n<pia-consent-input-radio-bloodsamples></pia-consent-input-radio-bloodsamples>\nLaborergebnisse: \n<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\nNasenabstriche: \n<pia-consent-input-radio-samples></pia-consent-input-radio-samples>\nEigenes Textfeld: \n<pia-consent-input-text-generic name="custom-textfield" label="Eigenes Textfeld"></pia-consent-input-text-generic>\nEigenes Einwilligungsfeld:\n<pia-consent-input-radio-generic name="custom-consent"></pia-consent-input-radio-generic>',
};

describe('Release Test, role: "EinwilligungsManager", Consent', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    proband = generateRandomProbandForStudy();

    ewManager = {
      username: `e2e-em-${translator.new()}@testpia-app.de`,
      role: 'EinwilligungsManager',
      study_accesses: [],
    };

    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [],
    };

    createStudy(study);
    createProfessionalUser(ewManager, study.name).as('ewCred');
    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(forscher, study.name).as('forscherCred');

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband.pseudonym, token);
        createProband(proband, study.name, token);
        getCredentialsForProbandByUsername(proband.pseudonym, token).then(
          (cred) => {
            probandCredentials = {
              username: cred.username,
              password: cred.password,
            };
          }
        );
      });

    cy.get<UserCredentials>('@ewCred').then((cred) => {
      ewCredentials = {
        username: cred.username,
        password: cred.password,
      };
    });

    cy.get<UserCredentials>('@forscherCred').then((cred) => {
      forscherCredentials = {
        username: cred.username,
        password: cred.password,
      };
    });
  });

  it('should include proper Menu items', () => {
    cy.visit(ADMIN_APP_URL);
    login(ewCredentials.username, ewCredentials.password);

    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Studien')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einwilligung')
      .should('be.visible');
  });

  it('should download the file compliances.csv with the compliances data from the probands', () => {
    // create consent for tn
    cy.get<UserCredentials>('@forscherCred')
      .then(loginProfessional)
      .then((token) =>
        createConsentForStudy(probandConsent, study.name, token)
      );

    // fill out consent as tn
    cy.visit(PROBAND_APP_URL);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, VALID_TEST_PASSWORD);

    cy.get('[data-e2e="e2e-consent-name-firstname"]')
      .find('input')
      .focus()
      .type('Max');
    cy.get('[data-e2e="e2e-consent-name-lastname"]')
      .find('input')
      .focus()
      .type('Mustermann');
    cy.get('[data-e2e="e2e-consent-name-birthdate"]')
      .find('input')
      .focus()
      .type('01.01.1990');
    cy.get('[data-e2e="e2e-consent-name-location"]')
      .find('input')
      .focus()
      .type('Testweg 1, 12345 Teststadt');
    cy.get('[data-e2e="e2e-consent-name-app"]')
      .find('mat-radio-button')
      .contains('Ja')
      .click();
    cy.get('[data-e2e="e2e-consent-name-bloodsamples"]')
      .find('mat-radio-button')
      .contains('Nein')
      .click();
    cy.get('[data-e2e="e2e-consent-name-labresults"]')
      .find('mat-radio-button')
      .contains('Ja')
      .click();
    cy.get('[data-e2e="e2e-consent-name-samples"]')
      .find('mat-radio-button')
      .contains('Ja')
      .click();
    cy.get('[data-e2e="e2e-consent-email-input"]')
      .find('input')
      .focus()
      .type('01.01.1990');
    cy.get('[data-e2e="e2e-consent-generic-radio"]')
      .find('mat-radio-button')
      .contains('Ja')
      .click();
    cy.get('[data-e2e="e2e-compliance-edit-ok-button"]').click();
    cy.get('#confirmbutton').click();

    // download compliances.csv
    logout(true);
    cy.visit(ADMIN_APP_URL);
    login(ewCredentials.username, ewCredentials.password);
    cy.intercept('**/api/v1/user/studies').as('getStudies');
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Einwilligung').click();
    cy.wait('@getStudies');

    cy.get('#selectstudy').click();
    cy.get('mat-option').click();
    cy.get('[data-e2e="download-compliances-button"]').click();

    // check downloaded file
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.readFile(path.join(downloadsFolder, 'export.zip'), 'binary').then(
      async (zipFileContent) => {
        const zip = new JSZip();

        const compliancesString = await (await zip.loadAsync(zipFileContent))
          .file('compliances.csv')
          .async('string');

        const compliances = parseCSV(compliancesString);

        const pseudonymIndex = compliances[0].findIndex(
          (header) => header === 'pseudonym'
        );
        const timestampIndex = compliances[0].findIndex(
          (header) => header === 'timestamp'
        );
        const firstnameIndex = compliances[0].findIndex(
          (header) => header === 'firstname'
        );
        const lastnameIndex = compliances[0].findIndex(
          (header) => header === 'lastname'
        );
        const addressIndex = compliances[0].findIndex(
          (header) => header === 'address'
        );
        const complianceAppIndex = compliances[0].findIndex(
          (header) => header === 'complianceApp'
        );
        const complianceSamplesIndex = compliances[0].findIndex(
          (header) => header === 'complianceSamples'
        );
        const complianceBloodsamplesIndex = compliances[0].findIndex(
          (header) => header === 'complianceBloodsamples'
        );
        const complianceLabresultsIndex = compliances[0].findIndex(
          (header) => header === 'complianceLabresults'
        );
        const customTextfieldIndex = compliances[0].findIndex(
          (header) => header === 'custom-textfield'
        );
        const customConsentIndex = compliances[0].findIndex(
          (header) => header === 'custom-consent'
        );

        cy.wrap(compliances[1][pseudonymIndex]).should('equal', '');
        cy.wrap(compliances[1][timestampIndex]).should((timestamp) => {
          const currentTimestamp = new Date().getTime();
          const timeWindow = 2 * 60 * 60 * 1000;
          const isWithinTimeWindow =
            Math.abs(parseInt(timestamp, 10) - currentTimestamp) <= timeWindow;
          expect(isWithinTimeWindow).to.equal(true);
        });
        cy.wrap(compliances[1][firstnameIndex]).should('equal', 'Max');
        cy.wrap(compliances[1][lastnameIndex]).should('equal', 'Mustermann');
        cy.wrap(compliances[1][addressIndex]).should(
          'equal',
          'Testweg 1, 12345 Teststadt'
        );
        cy.wrap(compliances[1][complianceAppIndex]).should('equal', '1');
        cy.wrap(compliances[1][complianceSamplesIndex]).should('equal', '1');
        cy.wrap(compliances[1][complianceBloodsamplesIndex]).should(
          'equal',
          ''
        );
        cy.wrap(compliances[1][complianceLabresultsIndex]).should('equal', '1');
        cy.wrap(compliances[1][customTextfieldIndex]).should(
          'equal',
          '01.01.1990'
        );
        cy.wrap(compliances[1][customConsentIndex]).should('equal', '1');
      }
    );
  });
});

const parseCSV = (data: string) => {
  const lines = data.split('\n');
  return lines.map((line) => line.split(';'));
};
