/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Plugin, Server } from '@hapi/hapi';
// Unfortunately there are no types for the following two packages
// They are also deprecated and should be replaced soon.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Good from '@hapi/good';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SafeJson, Squeeze } from '@hapi/good-squeeze';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GoodConsole from '@hapi/good-console';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Router from 'hapi-router';
import { HandleFieldValidationErrors } from './handleFieldValidationErrors';
import { Health } from './health';

import { Version } from './version';
import { Metrics } from './metrics';
import { ErrorHandler } from './errorHandler';
import { AssertStudyAccess } from './assertStudyAccess';

export interface ServicePluginOptions {
  name: string;
  version: string;
  routes?: string;
  isInternal?: boolean;
}

const logSqueezeArgs = [
  {
    log: '*',
    response: { exclude: 'nolog' },
    request: '*',
    'request-internal': '*',
  },
];

export const defaultPublicRoutesPaths = 'src/routes/{admin,proband}/*';
export const defaultInternalRoutesPaths = 'src/routes/internal/*';

export const registerPlugins = async (
  server: Server,
  options: ServicePluginOptions
): Promise<void> => {
  await server.register([
    Version, // registers the application version route
    Health, // registers the application health route
    Metrics, // registers the application metrics route
    HandleFieldValidationErrors, // handles errors regarding tsoa field validation errors
    ErrorHandler, // registers an error handler that logs server side errors (>=500)
    AssertStudyAccess, // registers a handler which checks study access at route level
  ]);

  if (options.routes) {
    await server.register({
      plugin: Router as Plugin<unknown>,
      options: {
        routes: options.routes,
        ignore: ['**/*.d.ts', '**/*.js.map'],
      },
    });
  }

  await server.register({
    plugin: Good as Plugin<unknown>,
    options: {
      reporters: {
        console: [
          {
            module: Squeeze as unknown,
            args: logSqueezeArgs,
          },
          {
            module: GoodConsole as unknown,
            args: [
              {
                format: 'HH:mm:ss DD.MM.YYYY',
                utc: false,
              },
            ],
          },
          'stdout',
        ],
      },
    },
  });
};
