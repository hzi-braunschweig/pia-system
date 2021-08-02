/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const fileHandler = require('../handlers/fileHandler');

module.exports = {
  path: '/questionnaire/files/{id}',
  method: 'GET',
  handler: fileHandler.getFileById,
  config: {
    description: 'get single file',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string().description('file id').required(),
      }).unknown(),
    },
  },
};
