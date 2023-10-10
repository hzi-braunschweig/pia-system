/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Chainable = Cypress.Chainable;
import { UserCredentials } from './user.commands';
import { getRandomId } from './helper.commands';

export interface Study {
  name: string;
  description: string;
  pm_email: string | null;
  hub_email: string | null;
  has_open_self_registration: boolean;
  max_allowed_accounts_count: number | null;
  has_required_totp: boolean;
  proband_realm_group_id?: string | null;
}

interface PendingStudyChangeRequest {
  requested_for: string;
  study_id: string;
  description_to?: string | null;
  has_rna_samples_to?: boolean;
  sample_prefix_to?: string | null;
  sample_suffix_length_to?: number | null;
  pseudonym_prefix_to?: string | null;
  pseudonym_suffix_length_to?: number | null;
  has_answers_notify_feature_to?: boolean;
  has_answers_notify_feature_by_mail_to?: boolean;
  has_four_eyes_opposition_to?: boolean;
  has_partial_opposition_to?: boolean;
  has_total_opposition_to?: boolean;
  has_compliance_opposition_to?: boolean;
  has_logging_opt_in_from?: boolean;
  has_logging_opt_in_to?: boolean;
}

/**
 * Creates a study
 *
 * @param study study to create
 */
export function createStudy(study: Study): Chainable<Study> {
  return cy
    .loginSysAdmin()
    .then((token) =>
      cy.request({
        method: 'POST',
        url: '/api/v1/user/admin/studies',
        headers: { Authorization: token },
        body: study,
        failOnStatusCode: false, // ignore existing study error
      })
    )
    .then((response) => {
      return cy.wrap(response.body as Study);
    });
}

/**
 * Creates a study with random name prefixed with "E2E-Teststudie-".
 * Returns the studyId.
 */
export function createRandomStudy(isOpen = false): Chainable<Study> {
  return cy.createStudy({
    name: 'E2E-Teststudie-' + getRandomId(),
    description: 'Studie zur Nutzung innerhalb der E2E-Tests',
    pm_email: null,
    hub_email: null,
    has_open_self_registration: isOpen,
    max_allowed_accounts_count: isOpen ? 3 : null,
    has_required_totp: false,
  });
}

/**
 * Configures the study to be editable without four eyes opposition
 * in order to make changes to the study more easily (e.g. delete probands).
 * As this change itself does need a four eyes opposition, a confirming forscher
 * is created for the study update confirmation.
 *
 * @param studyId The study the change
 */
export function disableFourEyesOpposition(studyId: string): Chainable {
  return changeStudy({
    study_id: studyId,
    has_four_eyes_opposition_to: false,
  });
}

export function configurePseudonymPrefix(studyId: string): Chainable {
  return changeStudy({
    study_id: studyId,
    pseudonym_prefix_to: 'DEV',
    pseudonym_suffix_length_to: 8,
  });
}

export function changeStudy(
  changes: Omit<PendingStudyChangeRequest, 'requested_for'>
): Chainable {
  return cy.fixture('users').then((users) => {
    return cy
      .createProfessionalUser(users.new.ConfirmingForscher, changes.study_id)
      .as('confirmingForscherCredentials')
      .then(() =>
        cy.createProfessionalUser(users.new.Forscher, changes.study_id)
      )
      .as('forscherCredentials')
      .then((forscherCredentials) => cy.loginProfessional(forscherCredentials))
      .then((token) =>
        cy
          .request({
            method: 'POST',
            url: '/api/v1/user/admin/pendingstudychanges',
            headers: { Authorization: token },
            body: {
              requested_for: users.new.ConfirmingForscher.username,
              ...changes,
            },
          })
          .then((result) => cy.wrap(result.body.id))
      )
      .then((pendingstudychangeId) => {
        return cy
          .get<UserCredentials>('@confirmingForscherCredentials')
          .then((confirmingForscherCredentials) =>
            cy.loginProfessional(confirmingForscherCredentials)
          )
          .then((token) =>
            cy.request({
              method: 'PUT',
              url:
                '/api/v1/user/admin/pendingstudychanges/' +
                pendingstudychangeId,
              headers: { Authorization: token },
            })
          )
          .then(() => cy.get<UserCredentials>('@confirmingForscherCredentials'))
          .then((confirmingForscherCredentials) =>
            cy.deleteProfessionalUser(confirmingForscherCredentials.username)
          )
          .then(() => cy.get<UserCredentials>('@forscherCredentials'))
          .then((forscherCredentials) =>
            cy.deleteProfessionalUser(forscherCredentials.username)
          );
      });
  });
}

export function selectStudy(studyName: string) {
  cy.get('[data-e2e="e2e-sidenav-content"]').click();
  cy.get('[data-e2e="e2e-sidenav-content"]').contains('Studien').click();

  cy.get('[data-e2e="e2e-study-select"]').click();
  cy.get('[data-e2e="e2e-study-option"]').contains(studyName).click();
}
