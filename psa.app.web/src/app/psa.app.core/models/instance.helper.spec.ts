/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Study } from './study';
import { Proband, ProbandOrigin } from './proband';
import { User } from './user';
import { ProbandToContact } from './probandToContact';
import { PersonalData } from './personalData';
import { PendingPersonalDataDeletion } from './pendingPersonalDataDeletion';
import { PendingComplianceChange } from './pendingComplianceChange';
import { PendingDeletion, PendingProbandDeletion } from './pendingDeletion';
import { ComplianceDataResponse, ComplianceText } from './compliance';
import { SegmentType } from './Segments';
import { BloodSample, LabResult } from './labresult';
import { ProfessionalAccount } from './professionalAccount';
import { Condition, Questionnaire } from './questionnaire';
import { Question } from './question';
import { AnswerOption } from './answerOption';
import { AnswerType } from './answerType';

export function createStudy(overwrite: Partial<Study> = {}): Study {
  return {
    proband_realm_group_id: 'abc-def',
    description: '',
    has_open_self_registration: false,
    max_allowed_accounts_count: null,
    accounts_count: 0,
    has_answers_notify_feature: false,
    has_answers_notify_feature_by_mail: false,
    has_compliance_opposition: false,
    has_four_eyes_opposition: false,
    has_partial_opposition: false,
    has_total_opposition: false,
    has_logging_opt_in: false,
    has_required_totp: false,
    pseudonym_prefix: 'DEV',
    pseudonym_suffix_length: 8,
    hub_email: '',
    name: '',
    pendingStudyChange: null,
    pm_email: '',
    status: 'active',
    ...overwrite,
  };
}

export function createProband(overwrite: Partial<Proband> = {}): Proband {
  return {
    pseudonym: 'Testproband',
    ids: undefined,
    study: 'NAKO Test',
    firstLoggedInAt: new Date('2020-04-20T00:00:00.000Z'),
    isTestProband: false,
    accountStatus: 'account',
    status: 'active',
    needsMaterial: false,
    complianceBloodsamples: false,
    complianceLabresults: false,
    complianceSamples: false,
    complianceContact: false,
    examinationWave: 0,
    studyCenter: '',
    deactivatedAt: null,
    deletedAt: null,
    createdAt: null,
    origin: ProbandOrigin.INVESTIGATOR,
    ...overwrite,
  };
}

export function createPendingProbandDeletion(
  overwrite: Partial<PendingProbandDeletion> = {}
): PendingProbandDeletion {
  return {
    id: 1,
    requested_by: '',
    requested_for: '',
    type: 'proband',
    for_id: 'TEST-0000000000',
    ...overwrite,
  };
}

export function createPendingPersonalDataDeletion(
  overwrite: Partial<PendingPersonalDataDeletion> = {}
): PendingPersonalDataDeletion {
  return {
    id: 1,
    requested_by: '',
    requested_for: '',
    study: '',
    proband_id: 'TEST-0000000000',
    ...overwrite,
  };
}

export function createPendingDeletion(
  overwrite: Partial<PendingDeletion> = {}
): PendingDeletion {
  return {
    id: 1,
    requested_by: '',
    requested_for: '',
    type: 'proband',
    for_id: 'TEST-0000000000',
    ...overwrite,
  };
}

export function createProfessionalAccount(
  overwrite: Partial<ProfessionalAccount> = {}
): ProfessionalAccount {
  return {
    username: 'Prof',
    role: 'Forscher',
    studies: [],
    ...overwrite,
  };
}

export function createUser(overwrite: Partial<User> = {}): User {
  return {
    username: 'Testuser',
    role: 'Proband',
    studies: ['Test Study'],
    ...overwrite,
  };
}

export function createPersonalData(
  overwrite: Partial<PersonalData> = {}
): PersonalData {
  return {
    pseudonym: 'TEST-0000000000',
    anrede: '',
    comment: '',
    email: '',
    haus_nr: '',
    landkreis: '',
    name: '',
    ort: '',
    plz: '',
    strasse: '',
    telefon_dienst: '',
    telefon_mobil: '',
    telefon_privat: '',
    titel: '',
    vorname: '',
    ...overwrite,
  };
}

export function createPendingComplianceChange(
  overwrite: Partial<PendingComplianceChange> = {}
): PendingComplianceChange {
  return {
    id: 1,
    requested_by: '',
    requested_for: '',
    proband_id: 'TEST-0000000000',
    compliance_bloodsamples_from: false,
    compliance_bloodsamples_to: false,
    compliance_labresults_from: false,
    compliance_labresults_to: false,
    compliance_samples_from: false,
    compliance_samples_to: false,
    ...overwrite,
  };
}

export function createProbandToContact(
  overwrite: Partial<ProbandToContact> = {}
): ProbandToContact {
  return {
    id: 1,
    user_id: 'TEST-0000000000',
    ids: null,
    status: 'active',
    accountStatus: 'account',
    created_at: new Date(),
    is_not_filledout: undefined,
    is_not_filledout_at: undefined,
    is_notable_answer: undefined,
    is_notable_answer_at: undefined,
    not_filledout_questionnaire_instances: [],
    notable_answer_questionnaire_instances: [],
    processed: undefined,
    processed_at: undefined,
    ...overwrite,
  };
}

export function createComplianceDataResponse(): ComplianceDataResponse {
  return {
    compliance_text_object: [
      { type: SegmentType.HTML, html: '<p>Lorem ipsum ... \n </p>' },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-app',
      },
    ],
    timestamp: undefined,
    textfields: {
      firstname: 'Michael',
      lastname: 'Myers',
      birthdate: new Date('01.01.1900'),
    },
    compliance_system: {
      app: true,
      samples: false,
      bloodsamples: true,
      labresults: true,
    },
    compliance_questionnaire: [
      { name: 'world-domination', value: true },
      { name: 'world-domination-memo', value: '' },
    ],
  };
}

export function createComplianceText(): ComplianceText {
  return {
    compliance_text_object: [
      { type: SegmentType.HTML, html: '<p>Lorem ipsum ... \n </p>' },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-app',
      },
    ],
    compliance_text:
      'Lorem ipsum ... \n <pia-consent-input-app></pia-consent-input-app>',
  };
}

export function createBloodSample(
  overwrite: Partial<BloodSample> = {}
): BloodSample {
  return {
    id: 1,
    user_id: 'Testproband',
    sample_id: 'TEST-111111',
    blood_sample_carried_out: true,
    remark: 'no remark',
    ...overwrite,
  };
}

export function createLabResult(overwrite: Partial<LabResult> = {}): LabResult {
  return {
    id: '1',
    user_id: 'Testproband',
    order_id: 2,
    dummy_sample_id: 'TEST-111111',
    performing_doctor: '',
    date_of_sampling: '2018-02-06',
    status: '',
    study_status: 'active',
    new_samples_sent: true,
    remark: 'no remark',
    ...overwrite,
  };
}

export function createQuestionnaire(
  overwrite: Partial<Questionnaire> = {}
): Questionnaire {
  return {
    id: 1234,
    study_id: 'TestStudy',
    name: 'TestQuestionnaire',
    no_questions: 2,
    cycle_amount: 0,
    cycle_unit: 'once',
    activate_after_days: 1,
    deactivate_after_days: 0,
    notification_tries: 1,
    notification_title: 'string',
    notification_body_new: 'string',
    notification_body_in_progress: 'string',
    notification_weekday: 'sunday',
    notification_interval: 2,
    notification_interval_unit: 'days',
    activate_at_date: 'string',
    compliance_needed: false,
    expires_after_days: 14,
    finalises_after_days: 2,
    cycle_per_day: 1,
    cycle_first_hour: 1,
    updated_at: new Date().toISOString(),
    type: 'for_probands',
    version: 1,
    publish: 'string',
    notify_when_not_filled: false,
    notify_when_not_filled_time: '08:00',
    notify_when_not_filled_day: 3,
    keep_answers: false,
    active: true,
    questions: [],
    condition: null,
    condition_error: null,
    condition_postview: null,
    ...overwrite,
  };
}

export function createQuestion(overwrite: Partial<Question> = {}): Question {
  return {
    id: 4321,
    questionnaire_id: 1,
    text: 'some intro text (dat=-5)',
    variable_name: 'some label',
    position: 1,
    is_mandatory: true,
    jump_step: 1,
    answer_options: createAnswerOptions(),
    condition: null,
    condition_error: null,
    ...overwrite,
  };
}

export function createAnswerOptions(): AnswerOption[] {
  return [
    createAnswerOption({
      id: 1,
      answer_type_id: AnswerType.Text,
      variable_name: 'symptomsComments',
    }),
    createAnswerOption({
      id: 2,
      answer_type_id: AnswerType.Number,
      variable_name: 'weight',
    }),
    createAnswerOption({
      id: 3,
      answer_type_id: AnswerType.Number,
      is_decimal: true,
      variable_name: 'temperature',
    }),
    createAnswerOption({
      id: 4,
      answer_type_id: AnswerType.Date,
      variable_name: 'onsetDate',
    }),
    createAnswerOption({
      id: 5,
      answer_type_id: AnswerType.SingleSelect,
      variable_name: 'lesionsArms',
      values: ['Yes', 'No'],
      values_code: [1, 0],
    }),
    createAnswerOption({
      id: 6,
      answer_type_id: AnswerType.SingleSelect,
      variable_name: 'lesionsFace',
      values: ['Yes', 'No'],
      values_code: [1, 0],
    }),
    createAnswerOption({
      id: 7,
      answer_type_id: AnswerType.MultiSelect,
      variable_name: 'temperatureSource',
      values: ['Infrared', 'Oral', 'Axillary', 'Rectal'],
      values_code: [1, 2, 3, 4],
    }),
    createAnswerOption({
      id: 8,
      answer_type_id: AnswerType.Timestamp,
      variable_name: 'onsetTimestamp',
    }),
  ];
}

export function createAnswerOption(
  overwrite: Partial<AnswerOption> = {}
): AnswerOption {
  return {
    id: 222,
    text: 'some question',
    variable_name: null,
    position: overwrite.id ?? 1,
    question_id: 4321,
    answer_type_id: AnswerType.Text,
    answer_value: null,
    is_condition_target: false,
    restriction_min: null,
    restriction_max: null,
    is_decimal: false,
    condition: null,
    condition_error: null,
    is_notable: null,
    values: [],
    values_code: [],
    ...overwrite,
  };
}
