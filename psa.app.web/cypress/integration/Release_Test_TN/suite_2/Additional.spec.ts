import {
  changePassword,
  createPlannedProband,
  createProband,
  createStudy,
  createUser,
  fetchEMailsByUsername,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  getToken,
  login,
  updateProbandData,
} from '../../../support/commands';
import { fetchPasswordForUserFromMailHog } from '../../../support/user.commands';

const short = require('short-uuid');
const translator = short();

let study;
let proband;
let ut;
let pm;
let forscher;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';
let message;
const appUrl = '/';

describe('Release Test, role: "Proband", Additional, PM', () => {
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

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [{ study_id: study.name, access_level: 'admin' }],
    };
    message = {
      receivers: [`${proband.pseudonym}@testpia-app.de`],
      subject: 'Wilkommen',
      content: 'Herzlich Wilkommen',
    };

    createStudy(study)
      .then(() => createUser(ut))
      .then(() => createUser(pm))
      .then(() => createUser(forscher))
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

  it('proband should receive e-mail if pm send mail notification', () => {
    fetchPasswordForUserFromMailHog(pm.username).then((cred) => {
      cy.visit(appUrl);
      login(cred.username, cred.password);
      changePassword(cred.password, newPassword);
      cy.get('[data-e2e="e2e-sidenav-content"]').click();

      cy.get('[data-e2e="e2e-sidenav-content"]')
        .contains('Kontaktieren')
        .click();

      cy.get('[data-e2e="e2e-contact-proband-receiver-input"]').click();
      cy.get('.mat-option-text').contains(proband.pseudonym).click();
      cy.get('[data-e2e="e2e-contact-proband-subject-input"').type(
        message.subject
      );
      cy.get('[data-e2e="e2e-contact-proband-message-textarea"]').type(
        message.content
      );

      cy.get('[data-e2e="e2e-contact-proband-email-checkbox"]').click();
      cy.get('[data-e2e="e2e-contact-proband-send-button"]').click();

      cy.get('#confirmbutton').click();
      fetchEMailsByUsername(probandCredentials.username).then((emails) => {
        const pmNotification = emails.find(
          (el) => el.Content.Body === 'Herzlich Wilkommen'
        );

        expect(pmNotification).to.not.be.undefined;
      });
    });
  });
});
