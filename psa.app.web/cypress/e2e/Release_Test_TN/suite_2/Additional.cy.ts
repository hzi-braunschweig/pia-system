/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createPlannedProband,
  createProband,
  createStudy,
  fetchEMailsByUsername,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
  updateProbandData,
} from '../../../support/commands';
import {
  createProfessionalUser,
  loginProfessional,
  UserCredentials,
} from '../../../support/user.commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';

const short = require('short-uuid');
const translator = short();

let study;
let proband: CreateProbandRequest;
let ut;
let pm;
let forscher;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';
let message;
const adminAppUrl = '/admin/';

describe('Release Test, role: "Proband", Additional, PM', () => {
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
    message = {
      receivers: [`${proband.pseudonym}@testpia-app.de`],
      subject: 'Wilkommen',
      content: 'Herzlich Wilkommen',
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

  it('proband should receive e-mail if pm sends mail notification', () => {
    cy.get<UserCredentials>('@pmCred').then((cred) => {
      cy.visit(adminAppUrl);
      login(cred.username, cred.password);

      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Kontaktieren')
        .click();

      cy.get('[data-e2e="e2e-contact-proband-study-select"]').click();
      cy.get('[data-e2e="option"]').contains(study.name).click();

      cy.get('[data-e2e="e2e-chip-autocomplete-input"]').click();
      cy.get('[data-e2e="option"]').contains(proband.pseudonym).click();
      cy.get('[data-e2e="e2e-contact-proband-subject-input"]').focus();
      cy.get('[data-e2e="e2e-contact-proband-subject-input"]').type(
        message.subject
      );
      cy.get('[data-e2e="e2e-contact-proband-message-textarea"]').focus();
      cy.get('[data-e2e="e2e-contact-proband-message-textarea"]').type(
        message.content
      );

      cy.get('[data-e2e="e2e-contact-proband-email-checkbox"]').click();
      cy.get('[data-e2e="e2e-contact-proband-send-button"]').click();

      cy.get('#confirmbutton').click();
      fetchEMailsByUsername(probandCredentials.username).then((emails) => {
        const pmNotification = emails.find(
          (el) => el.Content.Body === 'Herzlich Wilkommen'
        );

        expect(pmNotification).to.not.be.undefined;
      });
    });
  });
});
