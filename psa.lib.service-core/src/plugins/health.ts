/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Plugin, Server } from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';

// Add healthcheck property to ServerOptionsApp
declare module '@hapi/hapi' {
  interface ServerOptionsApp {
    healthcheck?: () => Promise<boolean>;
  }
}

/**
 * A hapi plugin to return the current health status via http status codes
 */
export const Health: Plugin<unknown> = {
  name: 'health',
  version: '1.0.0',
  register: function (server: Server) {
    server.route({
      method: 'GET',
      path: '/health',
      handler: async (_, h) => {
        const response = h.response('').type('text/plain').code(StatusCodes.OK);

        try {
          if (
            !server.settings.app?.healthcheck ||
            !(await server.settings.app.healthcheck())
          ) {
            response.code(StatusCodes.SERVICE_UNAVAILABLE);
          }
        } catch (err) {
          response.code(StatusCodes.SERVICE_UNAVAILABLE);
        }

        return response;
      },
      // The following ignores are needed as the config property is an untyped @hapi/good-squeeze property
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config: {
        tags: ['nolog'],
      },
    });
  },
};
