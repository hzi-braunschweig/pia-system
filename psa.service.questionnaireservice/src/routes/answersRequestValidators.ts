/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouteOptionsValidate } from '@hapi/hapi';
import Joi from 'joi';

import { PostAnswersRequest } from '../models/answer';

const MAX_FILE_SIZE = 27962026;

export const getAnswersValidation: RouteOptionsValidate = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .description('the id of the questionnaire instance')
      .required(),
  }).unknown(),
};

export const postAnswersValidation: RouteOptionsValidate = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .description('the id of the questionnaire instance')
      .required(),
  }).unknown(),
  payload: Joi.object<PostAnswersRequest>({
    answers: Joi.array()
      .items({
        question_id: Joi.number().integer().required().default(1),
        answer_option_id: Joi.number().integer().required().default(1),
        value: Joi.string()
          .max(MAX_FILE_SIZE) // ~20MB filesize based on the base64 encoding - https://en.wikipedia.org/wiki/Base64
          .allow('')
          .description('the answer value')
          .required()
          .default('Ja')
          .messages({
            'string.max': `answer value should have a maximum length of {#limit}`,
          }),
      })
      .min(0)
      .required(),
    date_of_release: Joi.string()
      .description('date of release answer')
      .optional()
      .allow(null),
    version: Joi.number().integer().optional().default(1),
  }).unknown(),
  failAction: (_request, _h, err) => err ?? null, // show detailed validation error
};

export const deleteAnswerValidation: RouteOptionsValidate = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .description('the id of the questionnaire instance')
      .required(),
    answerOptionId: Joi.number()
      .integer()
      .description('the id of the answer option to delete the answer for')
      .required(),
  }).unknown(),
};
