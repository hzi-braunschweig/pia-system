import { fetchPasswordForUserFromMailHog } from '../../../support/user.commands';
import {
  changePassword,
  createPlannedProband,
  createProband,
  createStudy,
  createUser,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  getToken,
  login,
  updateProbandData,
} from '../../../support/commands';

const short = require('short-uuid');
const translator = short();

let study;
let proband;
let ut;
let pm;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

describe('Release Test, role: "Proband", General', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    proband = generateRandomProbandForStudy(study.name);
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };

    createStudy(study)
      .then(() => createUser(ut))
      .then(() => createUser(pm))
      .then(() => getToken(ut.username))
      .then((token) => createPlannedProband(proband.pseudonym, token))
      .then(() => getToken(ut.username))
      .then((token) => createProband(proband, token))
      .then(() => getToken(pm.username))
      .then((token) =>
        updateProbandData(
          proband.pseudonym,
          {
            email: `${proband.pseudonym}@testpia-app.de`,
            haus_nr: '76',
            plz: '53117',
          },
          token
        )
      )
      .then(() => getToken(ut.username))
      .then((token) =>
        getCredentialsForProbandByUsername(proband.pseudonym, token)
      )
      .then((cred) => {
        probandCredentials.username = cred.username;
        probandCredentials.password = cred.password;
      });
  });

  it('should login and change password', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);
    cy.expectPathname('/home');
  });

  it('should test "Forgot password" functionality', () => {
    cy.visit(appUrl);
    cy.get('[data-e2e-login-input-username]').type(proband.pseudonym);

    // Request new Password
    cy.get('#forgottenPW').click();
    cy.get('#confirmButton').click();
    cy.get('#confirmbutton').click();

    fetchPasswordForUserFromMailHog(`${proband.pseudonym}@testpia-app.de`).then(
      (res) => {
        expect(res.password).to.be.a('string');
        cy.get('[data-e2e-login-input-password]').type(res.password);
        cy.get('#loginbutton').click({ force: true });

        // Change password
        cy.get('#oldPassword').type(res.password);
        cy.get('#newPassword1').type(newPassword);
        cy.get('#newPassword2').type(newPassword);
        cy.get('#changePasswordButton').click({ force: true });

        cy.expectPathname('/home');
      }
    );
  });
  it('it should test "Login"', () => {
    cy.visit(appUrl);

    login(probandCredentials.username, probandCredentials.password);
    // Change password
    changePassword(probandCredentials.password, newPassword);
    cy.expectPathname('/home');
  });
  it('it should test "Logout"', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    // Change password
    changePassword(probandCredentials.password, newPassword);
    cy.get('.mat-button-toggle-label-content > span').click();
    cy.get('#confirmButton').click();
    cy.expectPathname('/login');
  });
});
