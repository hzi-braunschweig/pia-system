import {
  fetchPasswordForUserFromMailHog,
  UserCredentials,
} from './user.commands';

import Chainable = Cypress.Chainable;

const short = require('short-uuid');
const translator = short();

export function getToken(username, password?): Chainable {
  if (password) {
    return cy
      .request({
        method: 'POST',
        url: '/api/v1/user/login',
        body: {
          username,
          password,
          logged_in_with: 'web',
          locale: 'de',
        },
      })
      .then((res) => res.body.token);
  } else {
    return fetchPasswordForUserFromMailHog(username)
      .then((res) =>
        cy.request({
          method: 'POST',
          url: '/api/v1/user/login',
          body: {
            username,
            password: res.password,
            logged_in_with: 'web',
            locale: 'de',
          },
        })
      )
      .then((res) => res.body.token);
  }
}

export function getSysAdminToken(): Chainable {
  return cy
    .fixture('users')
    .then((res) =>
      getToken(res.existing.SysAdmin.username, res.existing.SysAdmin.password)
    );
}

export function getForscherToken(): Chainable {
  return cy
    .fixture('users')
    .then((res) => res.new.Forscher.username)
    .then((username) => fetchPasswordForUserFromMailHog(username.toString()))
    .then((res) => getToken(res.username, res.password));
}

export function createStudy(body): Chainable {
  return getSysAdminToken().then((sysAdminToken) =>
    cy.request({
      method: 'POST',
      url: '/api/v1/questionnaire/studies',
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
      url: '/api/v1/user/users',
      body,
    })
  );
}

export function createPlannedProband(probandPseudonym, UTToken): Chainable {
  const pseudonym = [`${probandPseudonym}`];
  return cy.request({
    headers: { Authorization: UTToken },
    method: 'POST',
    url: '/api/v1/user/plannedprobands',
    body: { pseudonyms: pseudonym },
  });
}

export function createProband(body, UTToken): Chainable {
  return cy.request({
    headers: { Authorization: UTToken },
    method: 'POST',
    url: '/api/v1/user/probands',
    body,
  });
}

export function updateProbandData(pseudonym, data, token): Chainable {
  return cy.request({
    headers: { Authorization: token },
    method: 'PUT',
    url: `/api/v1/personal/personalData/proband/${pseudonym}`,
    body: data,
  });
}

export function login(name, password): void {
  cy.expectPathname('/login');
  cy.get('#username').type(name);
  cy.get('#password').type(password, {
    parseSpecialCharSequences: false,
  });

  cy.get('[data-2e2="select-language-dropdown"]').click();

  cy.get('[data-e2e="language-dropdown-item"]').contains('Deutsch').click();
  cy.contains('Anmelden');
  cy.get('[data-e2e-login-button]').click();
}

export function changePassword(oldPass, newPass): void {
  cy.expectPathname('/changePassword');
  cy.get('#oldPassword').type(oldPass, {
    parseSpecialCharSequences: false,
  });
  cy.get('#newPassword1').type(newPass, {
    parseSpecialCharSequences: false,
  });
  cy.get('#newPassword2').type(newPass, {
    parseSpecialCharSequences: false,
  });

  cy.get('#changePasswordButton').click({ force: true });
}

export function createConsentForStudy(consent, studyId, token?): Chainable {
  if (token) {
    return cy.request({
      method: 'PUT',
      url: `/api/v1/compliance/${studyId}/text`,
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

export function generateRandomProbandForStudy(studyId: string): any {
  return {
    pseudonym: `e2e-tn-${translator.new()}`,
    compliance_labresults: false,
    email: '',
    compliance_samples: false,
    compliance_bloodsamples: false,
    study_center: 'hzi',
    examination_wave: 1,
    study_accesses: [studyId],
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
      url: `/api/v1/user/plannedprobands/${username}`,
      headers: { Authorization: UTToken },
    })
    .then((res) => ({ username, password: res.body.password }));
}

export function createWelcomeText(body, studyId, token): Chainable {
  return cy.request({
    method: 'PUT',
    url: `/api/v1/questionnaire/studies/${studyId}/welcome-text`,
    headers: { Authorization: token },
    body,
  });
}

export function createQuestionnaire(questionnaire, forscherName): Chainable {
  return getToken(forscherName).then((token) =>
    cy.request({
      headers: { Authorization: token },
      method: 'POST',
      url: '/api/v1/questionnaire/questionnaires',
      body: questionnaire,
    })
  );
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
