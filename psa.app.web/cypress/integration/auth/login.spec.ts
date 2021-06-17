import { UserCredentials } from '../../support/user.commands';
import Chainable = Cypress.Chainable;

describe('Startseite', () => {
  beforeEach(() => {
    cy.createRandomStudy()
      .as('studyId')
      .then((studyId) => {
        cy.disableFourEyesOpposition(studyId)
          .then(() => cy.createRandomProband(studyId))
          .as('probandCredentials');
      });
  });

  it('should login a proband', () => {
    cy.visit('/');
    cy.get('[data-e2e-login-title]');

    loginProband().then(() => cy.expectPathname('/home'));
  });

  it('should not be possible to use PIA with a valid token but deactivated account', () => {
    cy.visit('/');
    cy.contains('Anmelden');

    loginProband()
      .then(() => cy.expectPathname('/home'))
      .then(() => cy.get<string>('@studyId'))
      .then((studyId) =>
        cy
          .get<UserCredentials>('@probandCredentials')
          .then((probandCredentials) =>
            cy.deleteProband(probandCredentials.username, studyId)
          )
          .then(() => cy.reload())
          .then(() => cy.expectPathname('/login'))
          .then(() => cy.get<UserCredentials>('@probandCredentials'))
          .then(() => loginProband(true))
          .then(() => cy.expectPathname('/login'))
      );
  });

  function loginProband(skipUsername = false): Chainable<UserCredentials> {
    return cy
      .get<UserCredentials>('@probandCredentials')
      .then((credentials) => {
        if (!skipUsername) {
          cy.get('[data-e2e-login-input-username]').type(credentials.username);
        }
        cy.get('[data-e2e-login-input-password]').type(credentials.password, {
          parseSpecialCharSequences: false,
        });
        cy.get('[data-e2e-login-button]').click();
        cy.wrap(credentials);
      });
  }
});
