/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { LaboratoryObservationsHandler } from '../../handlers/laboratoryObservationsHandler';

const route: ServerRoute = {
  path: '/admin/labObservations/names',
  method: 'GET',
  handler: LaboratoryObservationsHandler.getLabObservationNames,
  options: {
    description: 'returns existing laboratory observation names',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Forscher'],
    },
    tags: ['api'],
  },
};

export default route;
