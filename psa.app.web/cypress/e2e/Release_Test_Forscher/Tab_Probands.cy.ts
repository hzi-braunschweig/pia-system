/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createProfessionalUser,
  loginProfessional,
  ProfessionalUser,
  UserCredentials,
} from '../../support/user.commands';
import {
  createPlannedProband,
  createProband,
  createStudy,
  generateRandomProbandForStudy,
  generateRandomStudy,
} from '../../support/commands';
import 'cypress-file-upload';
import short from 'short-uuid';
import { ADMIN_APP_URL } from 'cypress/support/constants';
import { Study } from 'cypress/support/study.commands';

const translator = short();

let study: Study | undefined;
let study2: Study | undefined;

interface ExportOptions {
  start_date: null | string;
  end_date: null | string;
  questionnaires: { id: number; version: number }[];
  probands: [];
  exports: string[];
  study_name: string;
}

const exportOptions: ExportOptions = {
  start_date: null,
  end_date: null,
  questionnaires: [
    {
      id: 1,
      version: 1,
    },
  ],
  probands: [],
  exports: ['codebook'],
  study_name: '',
};

describe('Release Test, role: "Forscher", Administration', () => {
  const downloadsFolder = Cypress.config('downloadsFolder');

  beforeEach(() => {
    cy.task('deleteFolder', downloadsFolder);
    study = generateRandomStudy();
    study2 = generateRandomStudy();

    const forscher: ProfessionalUser = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [],
    };
    const forscher2: ProfessionalUser = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [],
    };
    const proband = generateRandomProbandForStudy();

    const ut: ProfessionalUser = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    const pm: ProfessionalUser = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [],
    };

    const em: ProfessionalUser = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'EinwilligungsManager',
      study_accesses: [],
    };
    createStudy(study);
    createStudy(study2);

    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(pm, study.name).as('pmCred');
    createProfessionalUser(em, study.name).as('emCred');
    createProfessionalUser(forscher, study.name).as('fCred');
    createProfessionalUser(forscher2, study2.name).as('f2Cred');

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband.pseudonym, token);
        createProband(proband, study.name, token);
      });
  });

  ['@fCred', '@f2Cred'].forEach((user) => {
    it('should return 200 for a forscher accessing his study ', () => {
      cy.get<UserCredentials>(user)
        .then(loginProfessional)
        .then((token) => {
          requestWithData(token, {
            ...exportOptions,
            study_name: user === '@fCred' ? study.name : study2.name,
          }).then((response) => {
            expect(response.status).to.eq(200);
          });
        });
    });
  });

  ['@fCred', '@f2Cred'].forEach((user) => {
    it('should return 403 for a forscher accessing another study', () => {
      cy.get<UserCredentials>(user)
        .then(loginProfessional)
        .then((token) => {
          requestWithData(token, {
            ...exportOptions,
            study_name: user === '@fCred' ? study2.name : study.name,
          }).then((response) => {
            expect(response.status).to.eq(403);
          });
        });
    });
  });

  ['@utCred', '@pmCred', '@emCred', '@pmCred'].forEach((user) => {
    it('should return 403 for other roles accessing a study ', () => {
      cy.get<UserCredentials>(user)
        .then(loginProfessional)
        .then((token) => {
          requestWithData(token, {
            ...exportOptions,
            study_name: study.name,
          }).then((response) => {
            expect(response.status).to.eq(403);
          });
        });
    });
  });
});

function extractToken(authHeader: string): string {
  return authHeader.split(' ')[1] || '';
}

function requestWithData(token: string, exportOptions: ExportOptions) {
  return cy.request({
    method: 'POST',
    url: `${ADMIN_APP_URL}api/v1/questionnaire/export`,
    body: {
      token: extractToken(token),
      exportOptions: JSON.stringify(exportOptions),
    },
    form: true,
    failOnStatusCode: false,
  });
}
