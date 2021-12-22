/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Study } from './study';
import { Proband, ProbandNew } from './proband';
import { AccessToken, LoginResponse, ProfessionalUser, User } from './user';
import { ProbandToContact } from './probandToContact';
import { PersonalData } from './personalData';
import { PendingPersonalDataDeletion } from './pendingPersonalDataDeletion';
import { PendingComplianceChange } from './pendingComplianceChange';
import { PendingProbandDeletion } from './pendingDeletion';
import { ComplianceDataResponse, ComplianceText } from './compliance';
import { SegmentType } from './Segments';

export function createStudy(overwrite: Partial<Study> = {}): Study {
  return {
    description: '',
    has_answers_notify_feature: false,
    has_answers_notify_feature_by_mail: false,
    has_compliance_opposition: false,
    has_four_eyes_opposition: false,
    has_partial_opposition: false,
    has_total_opposition: false,
    hub_email: '',
    name: '',
    pendingStudyChange: undefined,
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
    first_logged_in_at: new Date('2020-04-20T00:00:00.000Z'),
    is_test_proband: false,
    accountStatus: 'account',
    status: 'active',
    needs_material: false,
    complianceBloodsamples: false,
    complianceLabresults: false,
    complianceSamples: false,
    complianceContact: false,
    examination_wave: 0,
    study_center: '',
    ...overwrite,
  };
}

export function createProbandNew(
  overwrite: Partial<ProbandNew> = {}
): ProbandNew {
  return {
    pseudonym: 'Testproband',
    ids: undefined,
    study: 'Test study',
    firstLggedInAt: new Date('2020-04-20T00:00:00.000Z'),
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

export function createProfessionalUser(
  overwrite: Partial<ProfessionalUser> = {}
): ProfessionalUser {
  return {
    username: 'Prof',
    role: 'Forscher',
    study_accesses: [],
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

export function createLoginResponse(
  tokenPayload: Partial<AccessToken> = {},
  overwrite: Partial<LoginResponse> = {}
): LoginResponse {
  return {
    pw_change_needed: false,
    token_login:
      btoa(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      btoa(
        JSON.stringify({
          id: 2,
          username: tokenPayload.username ?? '',
          iat: Date.now(),
          exp: Date.now() + 60000,
        })
      ) +
      '.' +
      btoa('signature'),
    token:
      btoa(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      btoa(
        JSON.stringify({
          id: 1,
          role: tokenPayload.role ?? 'Proband',
          username: tokenPayload.username ?? '',
          groups: tokenPayload.groups ?? ['test study'],
          locale: 'de-DE',
          app: 'web',
          iat: Date.now(),
          exp: Date.now() + 60000,
        })
      ) +
      '.' +
      btoa('signature'),
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
