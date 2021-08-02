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

const parse = require('csv-parse/lib/sync');
const path = require('path');
const short = require('short-uuid');
const translator = short();

let study;
let study2;
let study3;
let study4;
let someRandomAnotherStudy;
let forscher;
let proband;
let ut;
let pm;
const forscherCredentials = { username: '', password: '' };
const probandCredentials = { username: '', password: '' };
const utCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Forscher", General', () => {
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
        { study_id: study.name, access_level: 'admin' },
        { study_id: study2.name, access_level: 'admin' },
        { study_id: study3.name, access_level: 'admin' },
        { study_id: study4.name, access_level: 'admin' },
      ],
    };
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
    createStudy(study);
    createStudy(study2);
    createStudy(study3);
    createStudy(study4);
    createStudy(someRandomAnotherStudy)
      .then(() => createUser(ut))
      .then(() => createUser(pm))
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
      })
      .then(() => fetchPasswordForUserFromMailHog(ut.username))
      .then((cred) => {
        utCredentials.username = cred.username;
        utCredentials.password = cred.password;
      })
      .then(() => createUser(forscher))
      .then(() => fetchPasswordForUserFromMailHog(forscher.username))
      .then((cred) => {
        forscherCredentials.username = cred.username;
        forscherCredentials.password = cred.password;
      });
  });

  it('should contain proband log data for login logout operations', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Abmelden').click();
    cy.get('#changeaccount').click();

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.contains('Abmelden').click();
    cy.get('.mat-dialog-container').find('button').contains('OK').click();

    cy.get('#changeaccount').click();
    login(forscherCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();
    cy.get('[data-e2e="e2e-study-dialog-select"]').click();
    cy.get('[data-e2e="e2e-study-to-select"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-select-proband-select"]').click();
    cy.get('[data-e2e="e2e-select-probands-checkbox"]')
      .contains(proband.pseudonym)
      .click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-activity-select"]').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Anmeldung').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Abmeldung').click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-request-logs-button"]').click();
    cy.get('[data-e2e="e2e-proband-name-column"]').should('have.length', 2);
  });
  it('should not contain any login for proband after proband deactivated logg function', () => {
    cy.visit(appUrl);

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Einstellungen')
      .click();

    cy.get('[data-e2e="acquisition-of-log-data-checkbox"]').click();
    cy.get('[data-e2e="e2e-save-button"]').click();

    cy.contains('Abmelden').click();
    cy.get('.mat-dialog-container').find('button').contains('OK').click();

    cy.get('#changeaccount').click();
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();

    // Wait to make sure the studies are (hopefully) fetched from the backend
    cy.wait(3000);

    cy.get('[data-e2e="e2e-study-dialog-select"]').click();
    cy.get('[data-e2e="e2e-study-to-select"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-select-proband-select"]').click();
    cy.get('[data-e2e="e2e-select-probands-checkbox"]')
      .contains(proband.pseudonym)
      .click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-activity-select"]').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Anmeldung').click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-request-logs-button"]').click();
    cy.wait(1000);
    cy.get('[data-e2e="e2e-proband-name-column"]').should('have.length', 1);
  });
  it('should test filter function', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Abmelden').click();
    cy.get('#changeaccount').click();

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.contains('Abmelden').click();
    cy.get('.mat-dialog-container').find('button').contains('OK').click();

    cy.get('#changeaccount').click();
    login(forscherCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();
    cy.get('[data-e2e="e2e-study-dialog-select"]').click();
    cy.get('[data-e2e="e2e-study-to-select"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-select-proband-select"]').click();
    cy.get('[data-e2e="e2e-select-probands-checkbox"]')
      .contains(proband.pseudonym)
      .click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-activity-select"]').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Anmeldung').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Abmeldung').click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-request-logs-button"]').click();

    cy.get('[data-e2e="e2e-filter-input"]').click().type('Anmeldung');

    // Wait until proband names are loaded in the UI
    cy.wait(500);

    cy.get('[data-e2e="e2e-proband-name-column"]').should('have.length', 1);
    cy.get('[data-e2e="e2e-proband-activity-column"]')
      .contains('Anmeldung')
      .should('exist');
  });
  it('should test download function', () => {
    cy.visit(appUrl);
    login(forscherCredentials.username, forscherCredentials.password);
    changePassword(forscherCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Abmelden').click();
    cy.get('#changeaccount').click();

    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.contains('Abmelden').click();
    cy.get('.mat-dialog-container').find('button').contains('OK').click();

    cy.get('#changeaccount').click();
    login(forscherCredentials.username, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Logs').click();
    cy.get('[data-e2e="e2e-study-dialog-select"]').click();
    cy.get('[data-e2e="e2e-study-to-select"]').contains(study.name).click();
    cy.get('[data-e2e="e2e-select-proband-select"]').click();
    cy.get('[data-e2e="e2e-select-probands-checkbox"]')
      .contains(proband.pseudonym)
      .click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-activity-select"]').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Anmeldung').click();
    cy.get('[data-e2e="e2e-activity-values"]').contains('Abmeldung').click();

    // Simulate escape button
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.wait(500);
    cy.get('body').trigger('keyup', { keyCode: 27 });

    cy.get('[data-e2e="e2e-request-logs-button"]').click();
    cy.get('[data-e2e="e2e-export-logs-button"]').click();

    const filename = path.join(downloadsFolder, 'logsReport.csv');

    cy.readFile(filename, { timeout: 15000 })
      .then((input) =>
        parse(input, {
          columns: true,
          skip_empty_lines: true,
        })
      )
      .then((res) => {
        expect(res).to.have.length(2);
        expect(res[0]).to.have.all.keys(
          'Aktivität',
          'Anhang',
          'App',
          'Proband',
          'Zeitstempel'
        );
        // tslint:disable-next-line:no-unused-expression
        expect(res[0]['Aktivität']).not.to.be.empty;
        expect(res[0]['App']).to.equal('web');
        // tslint:disable-next-line:no-unused-expression
        expect(res[0]['Anhang']).to.be.empty;
        expect(res[0]['Proband']).to.equal(proband.pseudonym);
        // tslint:disable-next-line:no-unused-expression
        expect(res[0]['Zeitstempel']).not.to.be.empty;
      });
  });
});
