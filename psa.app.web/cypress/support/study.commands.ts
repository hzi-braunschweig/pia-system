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
}

/**
 * Creates a study
 *
 * @param study study to create
 */
export function createStudy(study: Study): Chainable<string> {
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
      return cy.wrap(response.body.name as string);
    });
}

/**
 * Creates a study with random name prefixed with "E2E-Teststudie-".
 * Returns the studyId.
 */
export function createRandomStudy(): Chainable<string> {
  return cy.createStudy({
    name: 'E2E-Teststudie-' + getRandomId(),
    description: 'Studie zur Nutzung innerhalb der E2E-Tests',
    pm_email: null,
    hub_email: null,
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
  return cy.fixture('users').then((users) => {
    return cy
      .createProfessionalUser(users.new.ConfirmingForscher, studyId)
      .as('confirmingForscherCredentials')
      .then(() => cy.createProfessionalUser(users.new.Forscher, studyId))
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
              study_id: studyId,
              has_four_eyes_opposition_to: false,
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
