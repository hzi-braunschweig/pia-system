/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  changePassword,
  createPlannedProband,
  createProband,
  createQuestionnaire,
  createStudy,
  generateRandomProbandForStudy,
  generateRandomStudy,
  getCredentialsForProbandByUsername,
  login,
} from '../../../support/commands';
import { CreateProbandRequest } from '../../../../src/app/psa.app.core/models/proband';
import {
  createProfessionalUser,
  loginProfessional,
  ProfessionalUser,
  UserCredentials,
} from 'cypress/support/user.commands';

import short from 'short-uuid';

const translator = short();

let study;
let anotherTestStudy;
let proband: CreateProbandRequest;
let ut: ProfessionalUser;
let pm: ProfessionalUser;
let forscher: ProfessionalUser;
const probandCredentials = { username: '', password: '' };
const newPassword = ',dYv3zg;r:CB';

const appUrl = '/';

let q;
let conditionalQ;
let questionnaireFromAnotherStudy;

describe('Release Test, role: "Proband", Tab: Questionnaire', () => {
  beforeEach(() => {
    study = generateRandomStudy();
    anotherTestStudy = generateRandomStudy();
    proband = generateRandomProbandForStudy();
    ut = {
      username: `e2e-ut-${translator.new()}@testpia-app.de`,
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    pm = {
      username: `e2e-pm-${translator.new()}@testpia-app.de`,
      role: 'ProbandenManager',
      study_accesses: [],
    };

    forscher = {
      username: `e2e-f-${translator.new()}@testpia-app.de`,
      role: 'Forscher',
      study_accesses: [
        { study_id: anotherTestStudy.name, access_level: 'admin' },
      ],
    };

    conditionalQ = {
      name: 'Conditional Questionnaire',
      type: 'for_probands',
      study_id: study.name,
      cycle_amount: 1,
      activate_at_date: null,
      cycle_unit: 'once',
      cycle_per_day: null,
      cycle_first_hour: null,
      publish: 'allaudiences',
      keep_answers: false,
      activate_after_days: 0,
      deactivate_after_days: 1,
      notification_tries: 2,
      notification_title: 'Sie haben einen offenen Fragebogen',
      notification_weekday: null,
      notification_interval: null,
      notification_interval_unit: null,
      notification_body_new: 'Das ist ein neuer Fragebogen',
      notification_body_in_progress: 'Das ist ein laufender Fragebogen',
      compliance_needed: false,
      notify_when_not_filled: false,
      notify_when_not_filled_time: null,
      notify_when_not_filled_day: null,
      expires_after_days: 2,
      finalises_after_days: 5,
      questions: [
        {
          text: 'Conditional question',
          help_text: '',
          variable_name: '',
          position: 1,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 4,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
      ],
    };
    questionnaireFromAnotherStudy = {
      name: 'Ein Fragebogen aus eine andere Studie',
      type: 'for_probands',
      study_id: anotherTestStudy.name,
      cycle_amount: 1,
      activate_at_date: null,
      cycle_unit: 'once',
      cycle_per_day: null,
      cycle_first_hour: null,
      publish: 'allaudiences',
      keep_answers: false,
      activate_after_days: 0,
      deactivate_after_days: 1,
      notification_tries: 2,
      notification_title: 'Sie haben einen offenen Fragebogen',
      notification_weekday: null,
      notification_interval: null,
      notification_interval_unit: null,
      notification_body_new: 'Das ist ein neuer Fragebogen',
      notification_body_in_progress: 'Das ist ein laufender Fragebogen',
      compliance_needed: false,
      notify_when_not_filled: false,
      notify_when_not_filled_time: null,
      notify_when_not_filled_day: null,
      expires_after_days: 2,
      finalises_after_days: 5,
      questions: [
        {
          text: 'Wie alt sind Sie?',
          help_text: '',
          variable_name: '',
          position: 1,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 4,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
      ],
    };

    q = {
      name: 'Test Fragebogen',
      type: 'for_probands',
      study_id: study.name,
      cycle_amount: 1,
      activate_at_date: null,
      cycle_unit: 'once',
      cycle_per_day: null,
      cycle_first_hour: null,
      publish: 'allaudiences',
      keep_answers: false,
      activate_after_days: 0,
      deactivate_after_days: 1,
      notification_tries: 0,
      notification_title: '',
      notification_weekday: '',
      notification_interval: 0,
      notification_interval_unit: '',
      notification_body_new: '',
      notification_body_in_progress: '',
      compliance_needed: false,
      notify_when_not_filled: false,
      notify_when_not_filled_time: null,
      notify_when_not_filled_day: null,
      expires_after_days: 2,
      finalises_after_days: 5,
      questions: [
        {
          text: 'Wie heißen Sie?',
          help_text: '',
          variable_name: '',
          position: 1,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: 'Bitte tragen Sie Ihren Namen und Vornamen ein',
              variable_name: '',
              answer_type_id: 4,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
        {
          text: 'Wie alt sind Sie?',
          help_text: '',
          variable_name: '',
          position: 2,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 3,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
        {
          text: 'Single Select mit Radio Buttons',
          help_text: '',
          variable_name: '',
          position: 3,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [{ value: false }, { value: false }],
              values: [{ value: 'Männlich' }, { value: 'Weiblich' }],
              values_code: [{ value: 1 }, { value: 2 }],
              use_autocomplete: false,
            },
          ],
        },
        {
          text: 'Single Select mit Autocomplete',
          help_text: '',
          variable_name: '',
          position: 4,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [{ value: false }, { value: false }],
              values: [
                { value: 'Männlich' },
                { value: 'Weiblich' },
                { value: 'Divers' },
              ],
              values_code: [{ value: 1 }, { value: 2 }],
              use_autocomplete: true,
            },
          ],
        },
        {
          text: 'Multi Select ohne Autocomplete',
          help_text: '',
          variable_name: '',
          position: 5,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 2,
              is_notable: [
                { value: false },
                { value: false },
                { value: false },
              ],
              values: [
                { value: 'Fieber' },
                { value: 'Husten' },
                { value: 'Durchfall' },
              ],
              values_code: [{ value: 3 }, { value: 4 }, { value: 5 }],
              use_autocomplete: false,
            },
          ],
        },
        {
          text: 'Multi Select mit Autocomplete',
          help_text: '',
          variable_name: '',
          position: 6,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 2,
              is_notable: [
                { value: false },
                { value: false },
                { value: false },
              ],
              values: [
                { value: 'Fieber' },
                { value: 'Husten' },
                { value: 'Durchfall' },
              ],
              values_code: [{ value: 3 }, { value: 4 }, { value: 5 }],
              use_autocomplete: true,
            },
          ],
        },
        {
          text: 'Wann sind erste Symptome aufgetreten?',
          help_text: '',
          variable_name: '',
          position: 7,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 5,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
      ],
    };

    createStudy(study);
    createStudy(anotherTestStudy);

    createProfessionalUser(ut, study.name).as('utCred');
    createProfessionalUser(pm, study.name).as('pmCred');
    createProfessionalUser(forscher, study.name).as('fCred');

    cy.get<UserCredentials>('@utCred')
      .then(loginProfessional)
      .then((token) => {
        createPlannedProband(proband.pseudonym, token);
        createProband(proband, study.name, token);
        getCredentialsForProbandByUsername(proband.pseudonym, token).then(
          (cred) => {
            probandCredentials.username = cred.username;
            probandCredentials.password = cred.password;
          }
        );
      });

    cy.get<UserCredentials>('@fCred')
      .then(loginProfessional)
      .then((token) => {
        createQuestionnaire(q, token).then((res) => {
          const condition = {
            condition_type: 'external',
            condition_target_questionnaire: res.body.id,
            condition_target_answer_option:
              res.body.questions[0].answer_options[0].id,
            condition_operand: '==',
            condition_value: 'Foo',
            condition_link: 'OR',
            condition_target_questionnaire_version: '1',
          };
          conditionalQ.condition = condition;
          return createQuestionnaire(conditionalQ, token);
        });
        createQuestionnaire(questionnaireFromAnotherStudy, token);
      });
  });

  it('should only display questionnaires that belong to study', () => {
    cy.visit(appUrl);
    login(proband.pseudonym, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get(
      '[data-e2e="e2e-proband-questionnaire-table"] ion-item-group cdk-virtual-scroll-viewport'
    ).should('have.length', 1);

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-icon-td"]')
      .contains('NEU')
      .should('be.visible');

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(questionnaireFromAnotherStudy.name)
      .should('not.exist');
  });

  it('should fill out any questionnaire, submit it and the finished questionnaire should contain the correct values', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .click();

    cy.get('[data-e2e="e2e-input-type-text"]').type('Bar');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-number"]').type('23');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-single-select"]')
      .contains('Männlich')
      .click();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-autocomplete"]').click();
    cy.contains('Divers').click();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-multiselect"]')
      .contains('ion-checkbox', 'Fieber')
      .click();
    cy.get('[data-e2e="e2e-input-type-multiselect"]')
      .contains('ion-checkbox', 'Husten')
      .click();

    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-autocomplete-multiselect"]').click();
    cy.get('[data-e2e="e2e-input-type-autocomplete-multiselect-options"]')
      .should('be.visible')
      .contains('Husten')
      .click({ force: true });
    cy.get('[data-e2e="e2e-input-type-autocomplete-multiselect"]').click();
    cy.get('[data-e2e="e2e-input-type-autocomplete-multiselect-options"]')
      .should('be.visible')
      .contains('Durchfall')
      .click({ force: true });
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-date"]')
      .invoke('val', '2020-12-01')
      .trigger('input')
      .trigger('change')
      .trigger('blur');

    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('[data-e2e="e2e-swiper-button-send"]').click();
    cy.get('#confirmButton').should('exist').click();

    cy.expectPathname('/questionnaire');

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]').should('not.exist');

    cy.contains('ion-segment-button', 'Abgeschlossen').click();

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');
    checkEnteredQuestionnaireData();
  });

  it('should display second questionnaire only if condition defined in the first questionnaire is fulfilled', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(conditionalQ.name)
      .should('not.exist');

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .click();

    cy.get('[data-e2e="e2e-input-type-text"]').type('Foo');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-number"]').type('23');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-single-select"]')
      .contains('Männlich')
      .click();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-multiselect"]')
      .contains('ion-checkbox', 'Fieber')
      .click();
    cy.get('[data-e2e="e2e-input-type-multiselect"]')
      .contains('ion-checkbox', 'Husten')
      .click();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-date"]')
      .invoke('val', '2020-12-01')
      .trigger('input')
      .trigger('change')
      .trigger('blur');

    clickUntilSendAppears();

    cy.get('#confirmButton').should('exist').click();

    cy.location('pathname').should('match', /^\/questionnaire\/\d+$/);

    cy.contains('Conditional question').should('be.visible');
    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('not.exist');

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(conditionalQ.name)
      .should('be.visible');
  });

  it('should display a new questionnaire at the time specified by the researcher (role "Forscher")', () => {
    const q2 = {
      name: 'Created just now',
      type: 'for_probands',
      study_id: study.name,
      cycle_amount: 1,
      activate_at_date: null,
      cycle_unit: 'once',
      cycle_per_day: null,
      cycle_first_hour: null,
      publish: 'allaudiences',
      keep_answers: false,
      activate_after_days: 0,
      deactivate_after_days: 1,
      notification_tries: 0,
      notification_title: '',
      notification_weekday: '',
      notification_interval: 0,
      notification_interval_unit: '',
      notification_body_new: '',
      notification_body_in_progress: '',
      compliance_needed: false,
      notify_when_not_filled: false,
      notify_when_not_filled_time: null,
      notify_when_not_filled_day: null,
      expires_after_days: 2,
      finalises_after_days: 5,
      questions: [
        {
          text: 'Wie heißen Sie?',
          help_text: '',
          variable_name: '',
          position: 1,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: 'Bitte tragen Sie Ihren Namen und Vornamen ein',
              variable_name: '',
              answer_type_id: 4,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
        {
          text: 'Wie alt sind Sie?',
          help_text: '',
          variable_name: '',
          position: 2,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 3,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
        {
          text: 'Ihr Geschlecht',
          help_text: '',
          variable_name: '',
          position: 3,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [{ value: false }, { value: false }],
              values: [{ value: 'Männlich' }, { value: 'Weiblich' }],
              values_code: [{ value: 1 }, { value: 2 }],
            },
          ],
        },
        {
          text: 'Welche Symptome haben Sie?',
          help_text: '',
          variable_name: '',
          position: 4,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 2,
              is_notable: [
                { value: false },
                { value: false },
                { value: false },
              ],
              values: [
                { value: 'Fieber' },
                { value: 'Husten' },
                { value: 'Durchfall' },
              ],
              values_code: [{ value: 3 }, { value: 4 }, { value: 5 }],
            },
          ],
        },
        {
          text: 'Wann sind erste Symptome aufgetreten?',
          help_text: '',
          variable_name: '',
          position: 5,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 5,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
      ],
    };

    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');
    cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q2.name)
      .should('not.exist');

    cy.get<UserCredentials>('@fCred')
      .then(loginProfessional)
      .then((token) => {
        createQuestionnaire(q2, token);

        cy.expectPathname('/questionnaire');
        cy.reload();

        cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
          .find('[data-e2e="e2e-questionnaire-name"]')
          .contains(q.name)
          .should('be.visible');
        cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
          .find('[data-e2e="e2e-questionnaire-name"]')
          .contains(q2.name)
          .should('be.visible');
      });
  });
});

function checkEnteredQuestionnaireData() {
  cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
    .find('[data-e2e="e2e-questionnaire-name"]')
    .contains(q.name)
    .click();
  cy.contains('Wie heißen Sie').should('be.visible');

  clickUntilSendAppears();

  cy.get('#confirmButton').should('exist').click();

  cy.get('[data-e2e="e2e-proband-questionnaire-table"]')
    .find('[data-e2e="e2e-questionnaire-name"]')
    .contains(q.name)
    .click();

  cy.contains('ion-card', 'Wie heißen Sie?').within(() => {
    cy.contains('ion-item', 'Bar').should('exist');
  });

  cy.contains('ion-card', 'Wie alt sind Sie?').within(() => {
    cy.contains('ion-item', '23').should('exist');
  });

  cy.contains('ion-card', 'Single Select mit Radio Buttons').within(() => {
    cy.contains('ion-item', 'Männlich').should('exist');
  });

  cy.contains('ion-card', 'Single Select mit Autocomplete').within(() => {
    cy.contains('ion-item', 'Divers').should('exist');
  });

  cy.contains('ion-card', 'Multi Select ohne Autocomplete').within(() => {
    cy.contains('p', 'Fieber').should('exist');
    cy.contains('p', 'Husten').should('exist');
  });

  cy.contains('ion-card', 'Multi Select mit Autocomplete').within(() => {
    cy.contains('p', 'Husten').should('exist');
    cy.contains('p', 'Durchfall').should('exist');
  });

  cy.contains('ion-card', 'Wann sind erste Symptome aufgetreten?').within(
    () => {
      cy.contains('p', '01.12.20').should('exist');
    }
  );
}

function clickUntilSendAppears(maxRetries = 20) {
  if (maxRetries <= 0)
    throw new Error('Send button not found after max retries');

  cy.get('body').then(($body) => {
    if ($body.find('[data-e2e="e2e-swiper-button-send"]').length > 0) {
      cy.get('[data-e2e="e2e-swiper-button-send"]').click();
    } else if ($body.find('[data-e2e="e2e-swiper-button-next"]').length > 0) {
      cy.get('[data-e2e="e2e-swiper-button-next"]').click();
      cy.wait(300);
      clickUntilSendAppears(maxRetries - 1);
    } else {
      cy.wait(300);
      clickUntilSendAppears(maxRetries - 1);
    }
  });
}
