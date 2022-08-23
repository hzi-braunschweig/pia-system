/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Plugin, Server } from '@hapi/hapi';

/**
 * A hapi plugin to view some information about the current version
 */
export const Version: Plugin<unknown> = {
  name: 'version-info',
  version: '1.0.0',
  register: function (server: Server) {
    const prefix = 'VERSION_INFO_';
    const response = Object.fromEntries(
      Object.entries(process.env)
        .filter(
          ([key, value]) => key.startsWith(prefix) && value && value !== ''
        )
        .filter(
          ([key, value]) => key.startsWith(prefix) && value && value !== ''
        )
        .map(([key, value]) => [key.substring(prefix.length), value])
    );

    server.route({
      method: 'GET',
      path: '/version',
      handler: () => {
        return response;
      },
    });
  },
};
