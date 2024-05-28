/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPlugin, signalIsUp, signalIsNotUp } from '@promster/hapi';
import prom from 'prom-client';
import { Plugin, Server } from '@hapi/hapi';

// Add healthcheck property to ServerOptionsApp
declare module '@hapi/hapi' {
  interface ServerOptionsApp {
    healthcheck?: () => Promise<boolean>;
  }
}

/**
 * A hapi plugin for the metrics of the current running service instance
 */
const upPlugin: Plugin<unknown> = createPlugin();

export const Metrics: Plugin<unknown> = {
  name: 'metrics',
  version: '1.0.0',
  register: function (server: Server) {
    // Activate hapi route metrics collection
    void server.register(upPlugin);

    // Register prometheus endpoint
    server.route({
      method: 'GET',
      path: '/metrics',
      handler: async (_, h) => {
        // refresh health
        try {
          if (
            !server.settings.app?.healthcheck ||
            !(await server.settings.app.healthcheck())
          ) {
            throw new Error('healthcheck failed');
          }
          signalIsUp();
        } catch (err) {
          console.error(err);
          signalIsNotUp();
        }

        return h
          .response(await prom.register.metrics())
          .type(prom.register.contentType);
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
