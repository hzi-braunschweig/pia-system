/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { expect } from 'chai';
import { validatorQuestionnaireJson } from './questionnaireJson';
import { assert } from 'ts-essentials';

describe('validatorQuestionnaireExport', () => {
  it('should accept a minimal json questionnaire with questions', () => {
    const questionnaire = generateQuestionnaireJson();
    const result = validatorQuestionnaireJson.validate(questionnaire);
    expect(result, result.error?.message).not.to.have.property('error');
  });

  it('should complain about missing questions', () => {
    const questionnaire = generateQuestionnaireJson();
    questionnaire.questions = [];
    const result = validatorQuestionnaireJson.validate(questionnaire);
    expect(result).to.have.property('error');
    expect(result.error?.message).to.contain('questions');
  });

  it('should fill the default values for optional fields', () => {
    const questionnaire = generateQuestionnaireJson();
    const result = validatorQuestionnaireJson.validate(questionnaire);

    assert(result.value);
    const validQuestionnaire = result.value;

    expect(validQuestionnaire.name).to.equal(questionnaire.name);
    expect(validQuestionnaire.custom_name).to.equal(questionnaire.custom_name);
    expect(validQuestionnaire.publish).to.be.equal(questionnaire.publish);
    expect(validQuestionnaire.activate_after_days).to.equal(
      questionnaire.activate_after_days
    );
    expect(validQuestionnaire.deactivate_after_days).to.equal(
      questionnaire.deactivate_after_days
    );
    expect(validQuestionnaire.expires_after_days).to.equal(
      questionnaire.expires_after_days
    );
    expect(validQuestionnaire.finalises_after_days).to.equal(
      questionnaire.finalises_after_days
    );
    expect(validQuestionnaire.notification_tries).to.equal(
      questionnaire.notification_tries
    );

    expect(validQuestionnaire.$schema).to.be.undefined;
    expect(validQuestionnaire.cycle_first_hour).to.be.null;
    expect(validQuestionnaire.sort_order).to.be.null;
    expect(validQuestionnaire.type).to.be.a('string');
    expect(validQuestionnaire.cycle_amount).to.be.null;
    expect(validQuestionnaire.activate_at_date).to.be.null;
    expect(validQuestionnaire.cycle_unit).to.be.null;
    expect(validQuestionnaire.cycle_per_day).to.be.null;
    expect(validQuestionnaire.keep_answers).to.be.false;
    expect(validQuestionnaire.notification_tries).to.be.a('number');
    expect(validQuestionnaire.notification_title).to.be.a('string');
    expect(validQuestionnaire.notification_weekday).to.be.null;
    expect(validQuestionnaire.notification_interval).to.be.null;
    expect(validQuestionnaire.notification_interval_unit).to.be.null;
    expect(validQuestionnaire.notification_body_new).to.be.a('string');
    expect(validQuestionnaire.notification_body_in_progress).to.be.a('string');
    expect(validQuestionnaire.notification_link_to_overview).to.be.false;
    expect(validQuestionnaire.compliance_needed).to.be.false;
    expect(validQuestionnaire.notify_when_not_filled).to.be.false;
    expect(validQuestionnaire.notify_when_not_filled_time).to.be.null;
    expect(validQuestionnaire.notify_when_not_filled_day).to.be.null;
    expect(validQuestionnaire.questions).to.be.an('array');
    expect(validQuestionnaire.condition).to.be.undefined;
  });

  it('should complain about missing notification_title if notification_tries > 0', () => {
    const questionnaire = generateQuestionnaireJson();
    questionnaire.notification_tries = 1;
    const result = validatorQuestionnaireJson.validate(questionnaire);
    expect(result).to.have.property('error');
    expect(result.error?.message).to.include('notification_title');
  });

  it('should accept a full json questionnaire json', () => {
    const questionnaire = {
      name: 'F_tx',
      custom_name: 'Ftx-3',
      sort_order: null,
      type: 'for_probands',
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
      notification_link_to_overview: false,
      compliance_needed: false,
      notify_when_not_filled: false,
      notify_when_not_filled_time: null,
      notify_when_not_filled_day: null,
      expires_after_days: 2,
      finalises_after_days: 5,
      questions: [
        {
          text: 'Fragebogen aktivieren',
          help_text: '',
          variable_name: 'auto-58134304',
          id: -1,
          position: 1,
          is_mandatory: false,
          condition_error: null,
          answer_options: [
            {
              id: -1,
              position: 1,
              text: '',
              variable_name: 'auto-15728511',
              answer_type_id: 2,
              use_autocomplete: false,
              condition_error: null,
              is_notable: [],
              values: ['F_t2', 'F_t3'],
              values_code: [2, 3],
            },
          ],
        },
      ],
      condition_error: null,
      id: -1,
    };

    const result = validatorQuestionnaireJson.validate(questionnaire);

    expect(result, result.error?.message).not.to.have.property('error');
  });
});

function generateQuestionnaireJson(): any {
  return {
    name: 'QTest-1',
    custom_name: 'q-test-custom-name',
    publish: 'allaudiences',
    activate_after_days: 0,
    deactivate_after_days: 5,
    expires_after_days: 2,
    finalises_after_days: 5,
    notification_tries: 0,
    questions: [
      {
        text: 'How are you feeling?',
        variable_name: 'q1',
        answer_options: [
          {
            variable_name: 'ao1',
            answer_type_id: 4,
            is_notable: [],
            values: [],
            values_code: [],
          },
        ],
      },
    ],
  };
}
