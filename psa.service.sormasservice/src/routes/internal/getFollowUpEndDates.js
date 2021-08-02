/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');
const followUpEndDatesHandler = require('../../handlers/internal/followUpEndDatesHandler');

module.exports = {
  path: '/sormas/probands/followUpEndDates/{since}',
  method: 'GET',
  handler: followUpEndDatesHandler.getLatestFollowUpEndDates,
  config: {
    description: 'returns the latest follow up end dates',
    tags: ['api'],
    validate: {
      params: Joi.object({
        since: Joi.number()
          .description('return only results newer than this timestamp')
          .required(),
      }).unknown(),
    },
  },
};
