/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Chainable = Cypress.Chainable;
import * as mimelib from 'mimelib';
import { getRandomId } from './helper.commands';
import { CreateProbandRequest } from '../../src/app/psa.app.core/models/proband';

export interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Takes user credentials and performs a login in order to return a token for API requests
 *
 * @param user user to login
 * @param performPasswordChange performs an initial password change if true
 * @param type specifies wether an admin or proband account should be logged in
 */
export function login(
  user: UserCredentials,
  performPasswordChange: boolean,
  type: 'admin' | 'proband'
): Chainable<string> {
  return cy
    .request({
      method: 'POST',
      url: `/api/v1/auth/realms/pia-${type}-realm/protocol/openid-connect/token`,
      form: true,
      body: {
        client_id: `pia-${type}-web-app-client`,
        grant_type: 'password',
        scope: 'openid',
        username: user.username,
        password: user.password,
      },
    })
    .then((res) => {
      const token = `${res.body.token_type} ${res.body.access_token}`;
      if (!performPasswordChange || !res.body.pw_change_needed) {
        return cy.wrap(token);
      }
      return cy
        .request({
          method: 'POST',
          url: '/api/v1/user/changePassword',
          headers: { Authorization: token },
          body: {
            newPassword1: user.password,
            newPassword2: user.password,
            oldPassword: user.password,
            username: user.username,
          },
        })
        .then(() => token);
    });
}

export function loginProband(user: UserCredentials): Chainable<string> {
  return login(user, false, 'proband');
}

export function loginProfessional(user: UserCredentials): Chainable<string> {
  return login(user, false, 'admin');
}

export function loginSysAdmin(): Chainable<string> {
  return cy
    .fixture('users')
    .then((users) => cy.loginProfessional(users.existing.SysAdmin));
}

export type StudyAccessLevel = 'read' | 'write' | 'admin';

export interface ProfessionalUser {
  username: string;
  role:
    | 'Forscher'
    | 'ProbandenManager'
    | 'EinwilligungsManager'
    | 'Untersuchungsteam';
  study_accesses: { study_id: string; access_level: StudyAccessLevel }[];
}

/**
 * Creates professional role via API and returns its credentials
 * @param user the user to create
 * @param studyId the study which the user has admin access to
 */
export function createProfessionalUser(
  user: ProfessionalUser,
  studyId: string
): Chainable<UserCredentials> {
  const body = {
    ...user,
    study_accesses: [
      { study_id: studyId, access_level: 'admin' },
      ...(user.study_accesses ?? []),
    ],
    temporaryPassword: false,
  };
  return cy
    .loginSysAdmin()
    .then((token) =>
      cy.request({
        method: 'POST',
        url: '/api/v1/user/admin/users',
        headers: { Authorization: token },
        body,
      })
    )
    .then(() => fetchPasswordForUserFromMailHog(user.username));
}

export interface Proband {
  pseudonym: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  study_center: string;
  examination_wave: number;
  study: string;
  ut_email?: string;
  ids?: string;
}

/**
 * Creates a proband and returns its credentials.
 *
 * @param proband Proband data to be created
 * @param studyName The name of the study the proband should participate
 */
export function createProband(
  proband: CreateProbandRequest,
  studyName: string
): Chainable<UserCredentials> {
  return (
    cy
      .fixture('users')
      // 1. create UT for study
      .then((users) =>
        cy.createProfessionalUser(users.new.Untersuchungsteam, studyName)
      )
      .as('untersuchungsTeamCredentials')
      .then((untersuchungsTeam) => cy.loginProfessional(untersuchungsTeam))
      // 2. register pseudonym
      .then((token) =>
        cy
          .request({
            method: 'POST',
            url: '/api/v1/user/admin/plannedprobands',
            headers: { Authorization: token },
            body: { pseudonyms: [proband.pseudonym] },
          })
          .then(() => cy.wrap(token))
      )
      // 3. register proband with pseudonym
      .then((token) =>
        cy
          .request({
            method: 'POST',
            url: `/api/v1/user/admin/studies/${studyName}/probands`,
            headers: { Authorization: token },
            body: { ...proband, temporaryPassword: false },
          })
          .then(() => cy.wrap(token))
      )
      // 4. get password of new proband
      .then((token) =>
        cy.request({
          method: 'GET',
          url: '/api/v1/user/admin/plannedprobands/' + proband.pseudonym,
          headers: { Authorization: token },
        })
      )
      .then((result) => ({
        username: result.body.user_id,
        password: result.body.password,
      }))
      .as('credentials')
      .then((credentials) => cy.login(credentials, true, 'proband'))
      // 5. delete UT
      .then(() => cy.get<UserCredentials>('@untersuchungsTeamCredentials'))
      .then((utCredentials) =>
        cy.deleteProfessionalUser(utCredentials.username)
      )
      .then(() => cy.get<UserCredentials>('@credentials'))
  );
}

/**
 * Creates a proband with random pseudonym prefixed with "E2E-Proband-".
 * Returns the probands credentials.
 *
 * @param studyId Study the proband has access to
 */
export function createRandomProband(
  studyId: string
): Chainable<UserCredentials> {
  return cy.createProband(
    {
      pseudonym: 'E2E-Proband-' + getRandomId(),
      complianceLabresults: true,
      complianceSamples: true,
      complianceBloodsamples: true,
      studyCenter: 'E2E-Testcenter',
      examinationWave: 1,
    },
    studyId
  );
}

export function deleteProfessionalUser(username): Chainable {
  return cy.loginSysAdmin().then((token) =>
    cy.request({
      method: 'DELETE',
      url: '/api/v1/user/admin/users/' + username,
      headers: { Authorization: token },
      failOnStatusCode: false,
    })
  );
}

export function deleteProband(username, studyId: string): Chainable {
  return cy.fixture('users').then((users) =>
    cy
      .createProfessionalUser(users.new.ProbandenManager, studyId)
      .as('probandenManagerCredentials')
      .then((credentials) => cy.loginProfessional(credentials))
      .then((token) =>
        cy.request({
          method: 'POST',
          url: '/api/v1/user/admin/pendingdeletions',
          headers: { Authorization: token },
          body: {
            requested_for: users.new.ProbandenManager.username, // this is not valid if 4 eyes opposition is active
            type: 'proband',
            for_id: username,
          },
        })
      )
      .then(() => cy.get<UserCredentials>('@probandenManagerCredentials'))
      .then((probandenManagerCredentials) =>
        cy.deleteProfessionalUser(probandenManagerCredentials.username)
      )
  );
}

export function fetchPasswordResetLinkForUserFromMailHog(
  username: string,
  retryCount = 5
): Chainable<string> {
  return cy
    .request({
      method: 'GET',
      url:
        (Cypress.env('MAILSERVER_BASEURL') || 'http://localhost:8025') +
        `/api/v2/search?kind=to&query=${username}&start=0&limit=1`,
    })
    .then((result) => {
      if (!result.body.items.length && retryCount > 0) {
        return fetchPasswordResetLinkForUserFromMailHog(username, --retryCount);
      }
      return cy.wrap(extractLinkUrl(result.body.items[0].Content.Body));
    });
}

export function fetchPasswordForUserFromMailHog(
  username: string,
  retryCount = 5
): Chainable<UserCredentials> {
  return cy
    .request({
      method: 'GET',
      url:
        (Cypress.env('MAILSERVER_BASEURL') || 'http://localhost:8025') +
        `/api/v2/search?kind=to&query=${username}&start=0&limit=1`,
    })
    .then((result) => {
      if (!result.body.items.length && retryCount > 0) {
        return fetchPasswordForUserFromMailHog(username, --retryCount);
      }
      return cy.wrap({
        username,
        password: extractPassword(result.body.items[0].Content.Body),
      });
    });
}

function extractLinkUrl(body: string): string {
  return mimelib
    .decodeQuotedPrintable(body)
    .match(/<a href="(?<url>.*)" rel="nofollow">/).groups.url;
}

function extractPassword(body: string): string {
  return mimelib.decodeQuotedPrintable(
    body.match(
      /(?:Ihr Passwort:|Ihr neues Passwort lautet:) (?<password>[^\n\r]*)/
    ).groups.password
  );
}
