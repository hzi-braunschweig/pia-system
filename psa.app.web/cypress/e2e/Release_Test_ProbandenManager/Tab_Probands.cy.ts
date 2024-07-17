/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
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
  createPlannedProband,
  createProband,
  createStudy,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  loginWithCred,
} from '../../support/commands';

import short from 'short-uuid';
import path from 'path';
import { CreateProbandRequest } from 'src/app/psa.app.core/models/proband';
import { ADMIN_APP_URL } from 'cypress/support/constants';

const translator = short();

let study: RandomStudy;
let probandManager: ProfessionalUser;
let ut: ProfessionalUser;
let probands: CreateProbandRequest[];
const filePath = path.join(Cypress.config('downloadsFolder'), 'probands.csv');

describe('Release Test, role: "ProbandenManager", Probands', () => {
  beforeEach(() => {
    cy.task('deleteFileIfExists', filePath);

    study = generateRandomStudy();

    probands = [];
    for (let i = 0; i < 2; i++) {
      const proband = generateRandomProbandForStudy();
      probands.push(proband);
    }

    probandManager = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [],
    };
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    createStudy(study);

    createProfessionalUser(probandManager, study.name).as('pmCred');
    createProfessionalUser(ut, study.name).as('utCred');

    for (const [index, proband] of probands.entries()) {
      cy.get<UserCredentials>('@utCred')
        .then(loginProfessional)
        .then((token) => {
          createPlannedProband(proband.pseudonym, token);
          createProband(proband, study.name, token);
          getCredentialsForProbandByUsername(proband.pseudonym, token).as(
            `probandCred${index}`
          );
        });
    }
  });

  it('should include proper Menu items', () => {
    cy.visit(ADMIN_APP_URL);
    cy.get<UserCredentials>('@pmCred').then(loginWithCred);

    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Studien')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Teilnehmende')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Probenverwaltung')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Kontaktieren')
      .should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]')
      .contains('Zu kontaktieren')
      .should('be.visible');
  });

  it('should download the file probands.csv with the personal data from the probands', () => {
    cy.visit(ADMIN_APP_URL);
    cy.get<UserCredentials>('@pmCred').then(loginWithCred);
    cy.intercept('**/api/v1/user/studies').as('getStudies');
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Teilnehmende').click();
    cy.wait('@getStudies');

    cy.get('#selectstudy').click();
    cy.get('mat-option').click();

    const probandsData: Record<ProbandRowHeaderNames, string>[] = [];
    for (const [index, proband] of probands.entries()) {
      const probandData = {
        pseudonym: proband.pseudonym,
        anrede: 'Herr',
        titel: 'Dr.',
        vorname: 'Max' + index,
        name: 'Mustermann' + index,
        strasse: 'Musterstraße' + index,
        haus_nr: '1' + index,
        plz: '7070' + index,
        landkreis: 'Musterlandkreis' + index,
        ort: 'Musterort' + index,
        email: index + 'muster@mail.de',
        telefon_privat: '123' + index,
        telefon_dienst: '456' + index,
        telefon_mobil: '789' + index,
        comment: 'Testbemerkung' + index,
        studyCenter: 'hzi',
        status: 'active',
        accountStatus: 'account',
        deactivatedAt: '',
        deletedAt: '',
        ids: '',
      };
      probandsData.push(probandData);
      fillPersonalData(probandData);
    }

    checkCsv(probandsData);
  });
});

function fillPersonalData(values: Record<ProbandRowHeaderNames, string>) {
  cy.contains('mat-row', values.pseudonym)
    .find('[data-e2e="edit-personal-data-button"]')
    .click();
  cy.contains('Anrede').click({ force: true });
  cy.contains(values.anrede).click();
  cy.contains('Titel').type(values.titel);
  cy.contains('Vorname').type(values.vorname);
  cy.contains('Nachname').type(values.name);
  cy.contains('Straße').type(values.strasse);
  cy.contains('Haus').type(values.haus_nr);
  cy.contains('PLZ').type(values.plz);
  cy.contains('Landkreis').type(values.landkreis);
  cy.contains('Ort').type(values.ort);
  cy.contains('E-Mail').type(values.email);
  cy.contains('Private Telefonnummer').type(values.telefon_privat);
  cy.contains('Dienstliche Telefonnummer').type(values.telefon_dienst);
  cy.contains('Mobile Telefonnummer').type(values.telefon_mobil);
  cy.contains('Bemerkung').type(values.comment);
  cy.get('#buttonconfirm').click();
}

function parseCSV(data: string) {
  const lines = data.split('\n');
  return lines.map((line) => line.split(';'));
}

function checkCsv(probandsData: Record<ProbandRowHeaderNames, string>[]) {
  cy.get('[data-e2e="download-probands-button"]').click();
  cy.readFile(filePath, 'utf8').then(async (csvContent) => {
    const probandsCsv = parseCSV(csvContent);

    const indices = probandRowHeaderNames.reduce((acc, header) => {
      const index = probandsCsv[0].findIndex((h) => h === header);
      acc[header] = index;
      return acc;
    }, {} as Record<ProbandRowHeaderNames, number>);

    for (const proband of probandsData) {
      checkProbandRow(probandsCsv, indices, proband);
    }
  });
}

function checkProbandRow(
  csv: string[][],
  indices: Record<ProbandRowHeaderNames, number>,
  probandData: Record<ProbandRowHeaderNames, string>
) {
  const probandIndex = csv.findIndex(
    (probandRow) => probandRow[indices.pseudonym] === probandData.pseudonym
  );

  const row = csv[probandIndex];

  cy.wrap(row[indices.pseudonym]).should('equal', probandData.pseudonym);
  cy.wrap(row[indices.anrede]).should('equal', probandData.anrede);
  cy.wrap(row[indices.titel]).should('equal', probandData.titel);
  cy.wrap(row[indices.name]).should('equal', probandData.name);
  cy.wrap(row[indices.vorname]).should('equal', probandData.vorname);
  cy.wrap(row[indices.strasse]).should('equal', probandData.strasse);
  cy.wrap(row[indices.haus_nr]).should('equal', probandData.haus_nr);
  cy.wrap(row[indices.plz]).should('equal', probandData.plz);
  cy.wrap(row[indices.landkreis]).should('equal', probandData.landkreis);
  cy.wrap(row[indices.ort]).should('equal', probandData.ort);
  cy.wrap(row[indices.telefon_privat]).should(
    'equal',
    probandData.telefon_privat
  );
  cy.wrap(row[indices.telefon_dienst]).should(
    'equal',
    probandData.telefon_dienst
  );
  cy.wrap(row[indices.telefon_mobil]).should(
    'equal',
    probandData.telefon_mobil
  );
  cy.wrap(row[indices.email]).should('equal', probandData.email);
  cy.wrap(row[indices.comment]).should('equal', probandData.comment);
  cy.wrap(row[indices.ids]).should('equal', probandData.ids);
  cy.wrap(row[indices.status]).should('equal', probandData.status);
  cy.wrap(row[indices.studyCenter]).should('equal', probandData.studyCenter);
  cy.wrap(row[indices.deactivatedAt]).should(
    'equal',
    probandData.deactivatedAt
  );
  cy.wrap(row[indices.deletedAt]).should('equal', probandData.deletedAt);
  cy.wrap(row[indices.accountStatus]).should(
    'equal',
    probandData.accountStatus
  );
}

const probandRowHeaderNames = [
  'pseudonym',
  'anrede',
  'titel',
  'name',
  'vorname',
  'strasse',
  'haus_nr',
  'plz',
  'landkreis',
  'ort',
  'telefon_privat',
  'telefon_dienst',
  'telefon_mobil',
  'email',
  'comment',
  'ids',
  'status',
  'studyCenter',
  'deactivatedAt',
  'deletedAt',
  'accountStatus',
] as const;

type ProbandRowHeaderNames = typeof probandRowHeaderNames[number];
