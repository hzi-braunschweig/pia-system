/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { FileHandler } from '../../handlers/fileHandler';
import { getFileValidation } from '../filesRequestValidators';

const route: ServerRoute = {
  path: '/files/{id}',
  method: 'GET',
  handler: FileHandler.getFileById,
  options: {
    description: 'get single file',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: getFileValidation,
  },
};

export default route;
