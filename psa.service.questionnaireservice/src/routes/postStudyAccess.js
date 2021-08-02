/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const studyAccessesHandler = require('../handlers/studyAccessesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}/accesses',
  method: 'POST',
  handler: studyAccessesHandler.createOne,
  config: {
    description: 'creates the study access if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
      }).unknown(),
      payload: Joi.object({
        user_id: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
        access_level: Joi.string()
          .description('the access level of that user to that study')
          .required()
          .valid('read', 'write', 'admin')
          .default('read'),
      }).unknown(),
    },
  },
};
