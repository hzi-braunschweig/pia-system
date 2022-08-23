/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Plugin, Server } from '@hapi/hapi';
import { AccessToken } from '../auth/authModel';
import {
  assertStudyAccess,
  MissingStudyAccessError,
} from '../auth/assertStudyAccess';

declare module '@hapi/hapi' {
  export interface RouteOptionsApp {
    assertStudyAccess?: boolean;
  }
}

/**
 * A hapi plugin that checks whether the requesting user has the
 * permission to access the requested study.
 *
 * Requested study has to be defined via the path param "studyName".
 * The plugin will throw an error, if the path param value is undefined.
 *
 * Needs to be configured within the route config:
 *
 * @example
 * const route: ServerRoute = {
 *   path: '/study/{studyName}/example/{name}',
 *   method: 'GET',
 *   handler: ExampleHandler.getExample,
 *   options: {
 *     auth: {
 *       strategies: ['jwt-admin'],
 *       access: { scope: ['realm:Forscher'] },
 *     },
 *     app: { assertStudyAccess: true },
 *     validate: {
 *       params: Joi.object({
 *         studyName: Joi.string().description("name of the requested study").required(),
 *       }).unknown(),
 *     }
 * };
 *
 */
export const AssertStudyAccess: Plugin<unknown> = {
  name: 'assert-study-access',
  version: '1.0.0',
  register: function (server: Server) {
    /**
     * Intentionally not exported to keep route config simple
     */
    const studyPathParamName = 'studyName';

    /**
     * Needs to run within onPreHandler lifecycle as authentication and path param
     * validation must have run.
     */
    server.ext('onPreHandler', (r, h) => {
      const isActive = r.route.settings.app?.assertStudyAccess;

      if (isActive) {
        const decodedToken = r.auth.credentials as AccessToken;
        // object injection not possible due to previous param validation
        // eslint-disable-next-line security/detect-object-injection
        const studyName = r.params[studyPathParamName] as string;

        try {
          assertStudyAccess(studyName, decodedToken);
        } catch (error) {
          // Error must be returned instead of thrown otherwise
          // the error handler and hapi can't handle it
          return error as MissingStudyAccessError;
        }
      }
      return h.continue;
    });
  },
};
