/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  fetchPasswordForUserFromMailHog,
  UserCredentials,
} from './user.commands';
import { CreateProbandRequest } from '../../src/app/psa.app.core/models/proband';
import Chainable = Cypress.Chainable;

const short = require('short-uuid');
const translator = short();

export function getSysAdminToken(): Chainable {
  return cy
    .fixture('users')
    .then((res) => cy.login(res.existing.SysAdmin, false, 'admin'));
}

export function getForscherToken(): Chainable {
  return cy
    .fixture('users')
    .then((res) => res.new.Forscher.username)
    .then((username) => fetchPasswordForUserFromMailHog(username.toString()))
    .then((res) =>
      cy.loginProfessional({ username: res.username, password: res.password })
    );
}

export function createStudy(body): Chainable {
  return getSysAdminToken().then((sysAdminToken) =>
    cy.request({
      method: 'POST',
      url: '/api/v1/user/admin/studies',
      headers: { Authorization: sysAdminToken },
      body,
    })
  );
}

export function createUser(body): Chainable {
  return getSysAdminToken().then((sysAdminToken) =>
    cy.request({
      headers: { Authorization: sysAdminToken },
      method: 'POST',
      url: '/api/v1/user/admin/users',
      body,
    })
  );
}

export function createPlannedProband(probandPseudonym, UTToken): Chainable {
  const pseudonym = [`${probandPseudonym}`];
  return cy.request({
    headers: { Authorization: UTToken },
    method: 'POST',
    url: '/api/v1/user/admin/plannedprobands',
    body: { pseudonyms: pseudonym },
  });
}

export function createProband(
  body: CreateProbandRequest,
  studyName: string,
  UTToken: string
): Chainable {
  return cy.request({
    headers: { Authorization: UTToken },
    method: 'POST',
    url: `/api/v1/user/admin/studies/${studyName}/probands`,
    body,
  });
}

export function updateProbandData(pseudonym, data, token): Chainable {
  return cy.request({
    headers: { Authorization: token },
    method: 'PUT',
    url: `/api/v1/personal/admin/personalData/proband/${pseudonym}`,
    body: data,
  });
}

export function logout(confirm: boolean = true): void {
  cy.get('[data-e2e="e2e-logout"]').click();
  if (confirm) {
    cy.get('#confirmButton').click();
  }

  // make sure that the user is really logged out by waiting for the sign in
  cy.get('[data-e2e="login-form"]');
}

export function login(
  username: string,
  password: string,
  skipUsername = false
): void {
  cy.get('[data-e2e="login-form"]');

  if (!skipUsername) {
    cy.get('[data-e2e="login-input-username"]').type(username);
  }

  cy.get('[data-e2e="login-input-password"]').type(password, {
    parseSpecialCharSequences: false,
  });
  cy.get('[data-e2e="login-button"]').click();
}

export function changePassword(oldPass, newPass): void {
  cy.get('[data-e2e="login-update-form"]');

  cy.get('[data-e2e="login-password-new"]').type(newPass, {
    parseSpecialCharSequences: false,
  });
  cy.get('[data-e2e="login-password-confirm"]').type(newPass, {
    parseSpecialCharSequences: false,
  });

  cy.get('[data-e2e="login-submit-button"]').click();
}

export function createConsentForStudy(consent, studyId, token?): Chainable {
  if (token) {
    return cy.request({
      method: 'PUT',
      url: `/api/v1/compliance/admin/${studyId}/text`,
      headers: { Authorization: token },
      body: consent,
    });
  } else {
    return getForscherToken().then((forscherToken) =>
      cy.request({
        method: 'PUT',
        url: `/api/v1/compliance/${studyId}/text`,
        headers: { Authorization: forscherToken },
        body: consent,
      })
    );
  }
}

export function generateRandomProbandForStudy(): CreateProbandRequest {
  return {
    pseudonym: `e2e-tn-${translator.new().toLowerCase()}`,
    complianceLabresults: false,
    complianceSamples: false,
    complianceBloodsamples: false,
    studyCenter: 'hzi',
    examinationWave: 1,
  };
}

export function generateRandomStudy(): any {
  return {
    name: `e2e-teststudy-${translator.new()}`,
    description: 'Random study for random proband',
    pm_email: null,
    hub_email: null,
    has_rna_samples: false,
    sample_prefix: '',
    sample_suffix_length: null,
    pseudonym_prefix: '',
    pseudonym_suffix_length: null,
  };
}

export function getCredentialsForProbandByUsername(
  username,
  UTToken
): Chainable {
  return cy
    .request({
      method: 'GET',
      url: `/api/v1/user/admin/plannedprobands/${username}`,
      headers: { Authorization: UTToken },
    })
    .then((res) => ({ username, password: res.body.password }));
}

export function createWelcomeText(body, studyId, token): Chainable {
  return cy.request({
    method: 'PUT',
    url: `/api/v1/user/admin/studies/${studyId}/welcome-text`,
    headers: { Authorization: token },
    body,
  });
}

export function createQuestionnaire(questionnaire, token: string): Chainable {
  return cy.request({
    headers: { Authorization: token },
    method: 'POST',
    url: '/api/v1/questionnaire/admin/questionnaires',
    body: questionnaire,
  });
}

export function fetchEMailsByUsername(username): Chainable {
  return cy
    .request({
      method: 'GET',
      url:
        (Cypress.env('MAILSERVER_BASEURL') || 'http://localhost:8025') +
        `/api/v2/search?kind=to&query=${username}`,
    })
    .then((res) => res.body.items);
}
