/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { getRepository } from 'typeorm';
import { Study as StudyPayload } from '../models/study';
import { Study } from '../entities/study';
import { assert } from 'ts-essentials';
import { StudyService } from '../services/studyService';

const numericCharactersCount = 10;
const defaultPseudonymSuffixLength = 8; // configured at studies table schema
const duplicatePseudonymConflictAvoidRatio = 0.1;

/**
 * Validates, whether "max_allowed_accounts_count" is neither negative
 * nor it is lower than the currently configured value
 */
function assertMaxAllowedAccountsCountLowerLimit(
  maxAllowedAccountsCount: number,
  currentAccountsCount: number,
  previousMaxAllowedAccountsCount: number
): void {
  const lowerLimit = Math.max(
    currentAccountsCount,
    previousMaxAllowedAccountsCount
  );
  assert(
    maxAllowedAccountsCount >= lowerLimit,
    'value of "max_allowed_accounts_count" may not be negative, lower than the current value or lower than the current accounts count'
  );
}

/**
 * Validates, whether "max_allowed_accounts_count" does not exceed the
 * upper limit based on the pseudonym suffix length
 *
 * When creating a study we want to assure that there
 * are enough pseudonyms which can be generated based
 * on the pseudonym suffix length.
 *
 * We calculate the maximum possible number of pseudonyms
 * and take 10% of those as the threshold. By this we lower
 * the chance of duplicate pseudonyms when generating those
 * randomly.
 */
function assertMaxAllowedAccountsCountUpperLimit(
  maxAllowedAccountsCount: number,
  pseudonymSuffixLength: number | undefined
): void {
  const upperLimit =
    numericCharactersCount **
      (pseudonymSuffixLength ?? defaultPseudonymSuffixLength) *
    duplicatePseudonymConflictAvoidRatio;
  assert(
    maxAllowedAccountsCount <= upperLimit,
    'value of "max_allowed_accounts_count" exceeds the maximum allowed value'
  );
}

export const studyParamsValidation = Joi.object({
  studyName: Joi.string()
    .description('the name of the study')
    .required()
    .default('Teststudie1'),
}).unknown();

export const studyPayloadValidation = Joi.object({
  name: Joi.string()
    .description('the changed name of the study')
    .required()
    .default('NeueTeststudieGeändert'),
  description: Joi.string()
    .description('the changed description of the study')
    .required()
    .default('Beschreibung der neuen teststudie geändert'),
  pm_email: Joi.string()
    .description('the changed central email address of PM')
    .required()
    .lowercase()
    .allow(null)
    .email()
    .default('pm@pia.de'),
  hub_email: Joi.string()
    .description('central email address of hub lab')
    .required()
    .lowercase()
    .allow(null)
    .email()
    .default('hub@pia.de'),
  has_open_self_registration: Joi.boolean()
    .description('if true, a self-registration is possible in the study')
    .required()
    .default(false),
  max_allowed_accounts_count: Joi.number()
    .description('limit of maximum allowed active probands in the study')
    .when('has_open_self_registration', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.valid(null),
    })
    .default(null),
  has_required_totp: Joi.boolean()
    .description(
      'if true totp will be required for all professional users of the study'
    )
    .required()
    .default(true),
})
  .external(async (studyPayload: StudyPayload | null) => {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (studyPayload && studyPayload.max_allowed_accounts_count !== null) {
      const existingStudyOrUndefined = await getRepository(Study).findOne(
        studyPayload.name
      );
      const currentAccountsCount = existingStudyOrUndefined
        ? await StudyService.getCurrentAccountsCount(studyPayload.name)
        : 0;
      const currentMaxAllowedAccountsCount = existingStudyOrUndefined
        ? (await StudyService.getMaxAllowedAccountsCountOfStudy(
            studyPayload.name
          )) ?? 0
        : 0;
      assertMaxAllowedAccountsCountLowerLimit(
        studyPayload.max_allowed_accounts_count,
        currentAccountsCount,
        currentMaxAllowedAccountsCount
      );
      assertMaxAllowedAccountsCountUpperLimit(
        studyPayload.max_allowed_accounts_count,
        existingStudyOrUndefined?.pseudonym_suffix_length
      );
    }
  }, 'validates, whether "max_allowed_accounts_count" is within the allowed limits')
  .unknown();
