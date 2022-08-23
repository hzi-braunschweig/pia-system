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
