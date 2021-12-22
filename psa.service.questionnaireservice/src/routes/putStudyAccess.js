/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const studyAccessesHandler = require('../handlers/studyAccessesHandler');

module.exports = {
  path: '/questionnaire/studies/{name}/accesses/{username}',
  method: 'PUT',
  handler: studyAccessesHandler.updateOne,
  config: {
    description:
      'changes the study access level with the specified name if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
      payload: Joi.object({
        access_level: Joi.string()
          .description('the new access level of that user to that study')
          .required()
          .valid('read', 'write', 'admin')
          .default('read'),
      }).unknown(),
    },
  },
};
