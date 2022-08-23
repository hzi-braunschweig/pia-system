/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

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
  has_required_totp: Joi.boolean()
    .description(
      'if true totp will be required for all professional users of the study'
    )
    .required()
    .default(true),
}).unknown();
