/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const complianceTextHandler = require('../handlers/complianceTextHandler');

module.exports = {
  path: '/compliance/{study}/text',
  method: 'PUT',
  handler: complianceTextHandler.putComplianceText,
  config: {
    description: 'updates the compliance text',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
      }).unknown(),
      payload: Joi.object({
        compliance_text: Joi.string().required(),
        to_be_filled_by: Joi.string()
          .valid('Proband', 'Untersuchungsteam')
          .required(),
      }),
    },
  },
};
