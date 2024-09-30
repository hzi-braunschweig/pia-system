/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouteOptionsValidate } from '@hapi/hapi';
import Joi from 'joi';
import { MAX_PROGRESS } from '../models/questionnaireInstance';

export const getQuestionnaireInstanceValidation: RouteOptionsValidate = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .description('the id of the questionnaire instance')
      .required(),
  }).unknown(),
};

export const putQuestionnaireInstanceValidation: RouteOptionsValidate = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .description('the id of the questionnaire')
      .required(),
  }).unknown(),
  payload: Joi.object({
    status: Joi.string()
      .optional()
      .default(null)
      .valid(
        'inactive',
        'active',
        'in_progress',
        'released_once',
        'released_twice',
        'released',
        null
      ),
    progress: Joi.number()
      .required()
      .default(0)
      .min(0)
      .max(MAX_PROGRESS)
      .description('progress expressed as a percentage'),
    release_version: Joi.number()
      .optional()
      .default(null)
      .description('number of releasing times'),
  }).unknown(),
};
