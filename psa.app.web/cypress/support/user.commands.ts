/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Chainable = Cypress.Chainable;
import * as mimelib from 'mimelib';
import { TOTP } from 'totp-generator';
import { getRandomId } from './helper.commands';
import {
  CreateProbandRequest,
  ProbandOrigin,
} from '../../src/app/psa.app.core/models/proband';
import { setupTotpForSysAdmin } from './totp';
import JQueryWithSelector = Cypress.JQueryWithSelector;

export interface UserCredentials {
  username: string;
  password: string;
  totp?: string;
}

/**
 * Takes user credentials and performs a login in order to return a token for API requests
 *
 * @param user user to login
 * @param type specifies wether an admin or proband account should be logged in
 */
export function login(
  user: UserCredentials,
  type: 'admin' | 'proband'
): Chainable<string> {
  const optionalTotp = user.totp ? { totp: user.totp } : {};
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
        ...optionalTotp,
      },
    })
    .then((res) => cy.wrap(`${res.body.token_type} ${res.body.access_token}`));
}

export function loginProband(user: UserCredentials): Chainable<string> {
  return login(user, 'proband');
}

export function loginProfessional(user: UserCredentials): Chainable<string> {
  return login(user, 'admin');
}

export function loginSysAdmin(): Chainable<string> {
  return cy.fixture('users').then((users) =>
    cy
      .task('readFileMaybe', '.e2e-totp-secret')
      .then((totpSecretOrNull: string | null) => {
        if (totpSecretOrNull === null) {
          return setupTotpForSysAdmin().then(() => loginSysAdmin());
        }

        const { otp } = TOTP.generate(totpSecretOrNull);

        return login(
          {
            ...users.existing.SysAdmin,
            totp: otp,
          },
          'admin'
        );
      })
  );
}

export function logoutParticipant(): Chainable<
  JQueryWithSelector<HTMLElement>
> {
  cy.contains('Abmelden').click();
  // participant logout needs confirmation
  cy.get('[data-e2e="dialog-button-accept"]').click();
  // wait for logout to finish with all redirects
  return cy.get('[data-e2e="login-input-username"]').should('exist');
}

export function logoutProfessional(): Chainable<
  JQueryWithSelector<HTMLElement>
> {
  cy.contains('Abmelden').click();
  // professional logout needs no confirmation, we just need to click the button
  // wait for logout to finish with all redirects
  return cy.get('[data-e2e="login-input-username"]').should('exist');
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
      .then((credentials) => cy.login(credentials, 'proband'))
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
      origin: ProbandOrigin.INVESTIGATOR,
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

export function deleteProband(username: string, studyId: string): Chainable {
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

export function fetchEmailVerificationLinkForUserFromMailHog(
  username: string,
  retryCount = 5
): Chainable<string> {
  return fetchFromMailHogWithRetry(username, retryCount, (items) => {
    const verificationMail = items.find(
      (el) => el.Content.Headers.Subject[0] === 'E-Mail verifizieren'
    );
    return verificationMail
      ? extractLinkUrl(verificationMail.Content.Body)
      : null;
  });
}

export function fetchWelcomeMailForUserFromMailHog(
  username: string,
  retryCount = 5
): Chainable<string> {
  return fetchFromMailHogWithRetry(username, retryCount, (items) => {
    const welcomeMail = items.find((el) =>
      el.Content.Headers.Subject[0].includes('Willkommen bei PIA')
    );
    return welcomeMail
      ? mimelib.decodeQuotedPrintable(welcomeMail.Content.Body)
      : null;
  });
}

export function fetchPasswordResetLinkForUserFromMailHog(
  username: string,
  retryCount = 5
): Chainable<string> {
  return cy
    .request({
      method: 'GET',
      url:
        (Cypress.env('MAILSERVER_BASEURL') || 'https://mail-pia-app') +
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
        (Cypress.env('MAILSERVER_BASEURL') || 'https://mail-pia-app') +
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

function fetchFromMailHogWithRetry(
  username: string,
  retryCount = 5,
  findFn: (items) => string | null
): Chainable<any> {
  return cy
    .request({
      method: 'GET',
      url:
        (Cypress.env('MAILSERVER_BASEURL') || 'https://mail-pia-app') +
        `/api/v2/search?kind=to&query=${username}&start=0&limit=1`,
    })
    .then((result) => {
      const foundItemString = findFn(result.body.items);
      if ((!result.body.items.length && retryCount > 0) || !foundItemString) {
        return fetchFromMailHogWithRetry(username, --retryCount, (i) =>
          findFn(i)
        );
      }
      return cy.wrap(foundItemString);
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
