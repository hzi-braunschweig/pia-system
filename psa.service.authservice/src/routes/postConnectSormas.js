/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* How to work-around during development:

- Login as a Probandenmanager
- Execute something like that in your dev console:

localStorage.setItem('sormasProband',JSON.stringify({
  "pseudonym": "",
  "firstname": "Max",
  "lastname": "Mustermann",
  "email": "max.musterman@example.com",
  "uuid": "QQBSF6-G3FVA5-CSLMIN-QZXC2M4Q"
}));

- Call <your-pia-url>/sormas-iframe

*/

// This route is only used by SORMAS

const Joi = require('joi');

const connectSormasHandler = require('../handlers/connectSormasHandler.js');

module.exports = {
  path: '/user/connectSormas',
  method: 'POST',
  handler: connectSormasHandler.connectSormas,
  config: {
    description: 'Connect sormas with PIA via iframe',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        token: Joi.string()
          .required()
          .description('one-time token for authentication'),
        uuid: Joi.string().required().description('sormas proband uuid'),
        firstname: Joi.string()
          .required()
          .description('sormas proband first name'),
        lastname: Joi.string()
          .required()
          .description('sormas proband last name'),
        email: Joi.string()
          .optional()
          .allow(null, '')
          .description('sormas proband email'),
      }).unknown(),
    },
  },
};
