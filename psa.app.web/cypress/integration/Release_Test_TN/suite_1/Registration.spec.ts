/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createRandomProband,
  fetchEmailVerificationLinkForUserFromMailHog,
  fetchWelcomeMailForUserFromMailHog,
} from '../../../support/user.commands';
import { login } from '../../../support/commands';
import { Study } from '../../../support/study.commands';
import { createRandomMailAddress } from '../../../support/helper.commands';

describe('Registration', () => {
  const pseudonymRegex = /dev-\d{8}/m;

  beforeEach(() => {
    cy.createRandomStudy(true)
      .as('study')
      .then((study) => cy.configurePseudonymPrefix(study.name));
  });

  it('should be possible to register in an open study', () => {
    cy.get<Study>('@study').then((study) => {
      const probandMail = createRandomMailAddress('proband');

      registerProband(study, probandMail);

      cy.get('[data-e2e="auth-content"]').contains(
        'Sie müssen Ihre E-Mail-Adresse verifizieren, um den Account zu aktivieren.'
      );
    });
  });

  it('should require an email verification after registration', () => {
    cy.get<Study>('@study').then((study) => {
      const probandMail = createRandomMailAddress('proband');

      registerProband(study, probandMail);

      cy.get('[data-e2e="auth-content"]').contains(
        'Sie müssen Ihre E-Mail-Adresse verifizieren, um den Account zu aktivieren.'
      );

      fetchEmailVerificationLinkForUserFromMailHog(probandMail).then(
        (verificationLink) => {
          cy.wait(1000);

          cy.visit(verificationLink);

          cy.get('[data-e2e="auth-content"]')
            .contains('Ihre E-Mail-Adresse wurde erfolgreich verifiziert.')
            .contains('Ihr Benutzername lautet:')
            .contains(pseudonymRegex)
            .invoke('text')
            .then((text) => {
              const pseudonym = extractPseudonym(text);
              cy.get('[data-e2e="auth-content"]').find('a').click();

              login(pseudonym, 'probandPW_01');

              cy.expectPathname('/home');
            });
        }
      );
    });
  });

  it('should send a welcome mail with the pseudonym', () => {
    cy.get<Study>('@study').then((study) => {
      const probandMail = createRandomMailAddress('proband');

      registerProband(study, probandMail);

      cy.get('[data-e2e="auth-content"]').contains(
        'Sie müssen Ihre E-Mail-Adresse verifizieren, um den Account zu aktivieren.'
      );

      fetchEmailVerificationLinkForUserFromMailHog(probandMail)
        .then((verificationLink) => {
          cy.wait(1000); // wait for registration event to be processed
          cy.visit(verificationLink);
          return fetchWelcomeMailForUserFromMailHog(probandMail);
        })
        .then((body) => {
          expect(body).contains(
            'Vielen Dank, dass Sie zur Teilnahme an unserer Studie und der Verwendung von PIA bereit sind!'
          );

          const pseudonym = extractPseudonym(body);

          cy.get('[data-e2e="auth-content"]').find('a').click();

          login(pseudonym, 'probandPW_01');

          cy.expectPathname('/home');
        });
    });
  });

  it('should not be possible to register if account limit is reached when accessing the registration form', () => {
    cy.get<Study>('@study').then((study) => {
      createRandomProband(study.name);
      createRandomProband(study.name);
      createRandomProband(study.name);

      cy.visit('/registration/' + study.proband_realm_group_id);

      cy.get('[data-e2e="auth-content"]').contains(
        'Die Studie hat die maximale Anzahl möglicher Teilnehmer:innen erreicht.'
      );
    });
  });

  it('should not be possible to register if account limit is reached when submitting the registration form', () => {
    cy.get<Study>('@study').then((study) => {
      createRandomProband(study.name);
      createRandomProband(study.name);

      cy.visit('/registration/' + study.proband_realm_group_id).then(() =>
        createRandomProband(study.name)
      );

      const probandMail = createRandomMailAddress('proband');
      registerProband(study, probandMail, true);

      cy.get('[data-e2e="auth-content"]').contains(
        'Die Studie hat die maximale Anzahl möglicher Teilnehmer:innen erreicht.'
      );
    });
  });

  it('should not be possible to register for a closed study', () => {
    cy.createRandomStudy(false).then((study) => {
      cy.visit('/registration/' + study.proband_realm_group_id);

      cy.get('[data-e2e="auth-content"]').contains(
        'Eine Registrierung zu dieser Studie ist nicht möglich.'
      );
    });
  });

  it('should not be possible to register for a non-existing study', () => {
    cy.createRandomStudy(false).then((study) => {
      cy.visit('/registration/this-is-a-invalid-group-id');

      cy.get('[data-e2e="auth-content"]').contains(
        'Eine Registrierung zu dieser Studie ist nicht möglich.'
      );
    });
  });

  function registerProband(
    study: Study,
    probandMail: string,
    skipVisit = false
  ): void {
    if (!skipVisit) {
      cy.visit('/registration/' + study.proband_realm_group_id);
    }

    cy.get('[data-e2e="registration-subtitle"]')
      .contains('Registrierung zur Studie')
      .contains(study.name);

    cy.get('[data-e2e="registration-input-email"]').type(probandMail);
    cy.get('[data-e2e="registration-input-password"]').type('probandPW_01');
    cy.get('[data-e2e="registration-input-password-confirm"]').type(
      'probandPW_01'
    );

    cy.get('[data-e2e="registration-checkbox-tos-confirm"]').check();
    cy.get('[data-e2e="registration-checkbox-policy-confirm"]').check();

    cy.get('[data-e2e="registration-submit-button"]').click();
  }

  function extractPseudonym(text: string): string {
    return text.match(pseudonymRegex)[0];
  }
});
