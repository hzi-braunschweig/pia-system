/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UserCredentials, loginProfessional } from './user.commands';
import Chainable = Cypress.Chainable;

export interface Credentials {
  username: string;
  password: string;
}

export interface LabResult {
  sample_id: string;
  new_samples_sent: boolean | null;
  dummy_sample_id?: string;
}

export function updateLabResultTemplateText(
  forscherCredentials: Credentials,
  studyName: string,
  markdownText: string
): Chainable<unknown> {
  return cy
    .loginProfessional(forscherCredentials)
    .then((token) =>
      cy.request({
        method: 'PUT',
        url: `/admin/api/v1/sample/studies/${studyName}/labResultTemplate`,
        headers: { Authorization: token },
        body: { markdownText },
      })
    )
    .then((response) => {
      return cy.wrap(response.body);
    });
}

export function postLabResult(
  probandId: string,
  labResult: LabResult
): Chainable<unknown> {
  return cy
    .get<UserCredentials>('@utCred')
    .then(loginProfessional)
    .then((token) =>
      cy.request({
        method: 'POST',
        url: `/admin/api/v1/sample/probands/${probandId}/labResults`,
        headers: { Authorization: token },
        body: labResult,
      })
    )
    .then((response) => {
      return cy.wrap(response.body);
    });
}
