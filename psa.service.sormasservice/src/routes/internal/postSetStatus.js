/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');
const statusHandler = require('../../handlers/internal/statusHandler');

module.exports = {
  path: '/sormas/probands/setStatus',
  method: 'POST',
  handler: statusHandler.setStatus,
  config: {
    description: 'sets the status of a proband in SORMAS',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        uuid: Joi.string().required().description('sormas uuid'),
        status: Joi.string()
          .required()
          .valid('REGISTERED', 'ACCEPTED', 'REJECTED', 'DELETED')
          .description('sormas status text'),
      }),
    },
  },
};
