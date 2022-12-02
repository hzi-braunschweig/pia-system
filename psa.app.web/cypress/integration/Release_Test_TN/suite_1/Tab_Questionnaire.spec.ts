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

const short = require('short-uuid');
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
          text: 'Wie alt sind sie?',
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

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('.mat-row')
      .should('have.length', 1);

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-icon-td"]')
      .contains('NEU')
      .should('be.visible');

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(questionnaireFromAnotherStudy.name)
      .should('not.exist');
  });

  it('should fill out any questionnaire and submit it', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .click();

    cy.get('[data-e2e="e2e-input-type-text"]').type('Bar');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-number"]').type('23');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-radio-group"]')
      .contains('Männlich')
      .click();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-checkbox-group"]')
      .find('[value="Fieber"]')
      .check();
    cy.get('[data-e2e="e2e-input-type-checkbox-group"]')
      .find('[value="Husten"]')
      .check();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-date"]').find('input').type('01.12.20');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('button').contains('Fragebogen abschicken').click();

    cy.get('#confirmbutton').click();

    cy.expectPathname('/questionnaires/user');

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('.mat-row')
      .should('not.exist');

    cy.get('.mat-tab-label-content')
      .contains('Abgeschlossene Fragebögen')
      .click();

    cy.get('[data-e2e="e2e-proband-completed-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');
  });

  it('should display second questionnaire only if condition defined in the first questionnaire is fulfilled', () => {
    cy.visit(appUrl);
    login(probandCredentials.username, probandCredentials.password);
    changePassword(probandCredentials.password, newPassword);

    cy.get('[data-e2e="e2e-sidenav-content"]').click();

    cy.get('[data-e2e="e2e-sidenav-content"]').contains('Fragebögen').click();

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('be.visible');

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(conditionalQ.name)
      .should('not.exist');

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .click();

    cy.get('[data-e2e="e2e-input-type-text"]').type('Foo');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-number"]').type('23');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-radio-group"]')
      .contains('Männlich')
      .click();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-checkbox-group"]')
      .find('[value="Fieber"]')
      .check();
    cy.get('[data-e2e="e2e-input-type-checkbox-group"]')
      .find('[value="Husten"]')
      .check();
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();

    cy.get('[data-e2e="e2e-input-type-date"]').find('input').type('01.12.20');
    cy.get('[data-e2e="e2e-swiper-button-next"]').click();
    cy.get('button').contains('Fragebogen abschicken').click();

    cy.get('#confirmbutton').click();

    cy.expectPathname('/questionnaires/user');
    cy.reload();

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('[data-e2e="e2e-questionnaire-name"]')
      .contains(q.name)
      .should('not.exist');

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
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
          text: 'Wie alt sind sie?',
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

    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('.mat-row')
      .should('have.length', 1);
    cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
      .find('.mat-row')
      .contains(q2.name)
      .should('not.exist');
    cy.get<UserCredentials>('@fCred')
      .then(loginProfessional)
      .then((token) => {
        createQuestionnaire(q2, token);

        cy.expectPathname('/questionnaires/user');
        cy.reload();

        cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
          .find('.mat-row')
          .should('have.length', 2);
        cy.get('[data-e2e="e2e-proband-open-questionnaire-table"]')
          .find('.mat-row')
          .contains(q2.name)
          .should('be.visible');
      });
  });
});
