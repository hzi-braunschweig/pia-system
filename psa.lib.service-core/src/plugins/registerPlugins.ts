/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Plugin, Server } from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import Swagger from 'hapi-swagger';
// Unfortunately there are not types for the following two packages
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
import { createStream } from 'rotating-file-stream';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Router from 'hapi-router';

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
    Inert, // required by hapi-swagger
    Vision, // required by hapi-swagger
    Version, // registers the application version route
    Metrics, // registers the application metrics route
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
        file: [
          {
            module: Squeeze as unknown,
            args: logSqueezeArgs,
          },
          {
            module: SafeJson as unknown,
          },
          {
            module: createStream,
            args: [
              'log',
              {
                interval: '1d',
                compress: 'gzip',
                path: './logs',
              },
            ],
          },
        ],
      },
    },
  });

  await server.register({
    plugin: Swagger,
    options: {
      documentationPage: true,
      info: {
        title: `API Documentation ${options.name}${
          options.isInternal ? ' Internal' : ''
        }`,
        version: options.version,
      },
      securityDefinitions: {
        jwt: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
      security: [{ jwt: [] }],
    },
  });
};
