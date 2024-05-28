/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConfigUtils } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';
import { nonExposedKeycloakPaths } from './nonExposedKeycloakPaths';
import { ProxyRouteConfig } from './proxyRoute';
import { ResponseRouteConfig } from './responseRoute';

const apiPath = '/api/v1/';
const adminApiPath = '/admin/api/v1/';
const publicApiPath = '/public/api/v1/';

const upstreamPath = '/';
const adminUpstreamPath = '/admin/';
const publicUpstreamPath = '/public/';

const isDevelopment =
  ConfigUtils.getEnvVariable('IS_DEVELOPMENT_SYSTEM', 'false').toLowerCase() ===
  'true';

const publicMetaData = {
  minimalAppVersion: '1.29.19',
};

const responseRoutes: ResponseRouteConfig[] = [
  ...(isDevelopment ? [] : nonExposedKeycloakPaths),
  {
    path: '/api/v1/',
    response: {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(publicMetaData),
    },
  },
];

const routes: ProxyRouteConfig[] = [
  {
    path: apiPath + 'questionnaire/',
    upstream: {
      host: 'questionnaireservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('QUESTIONNAIRESERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'questionnaire/',
    upstream: {
      host: 'questionnaireservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('QUESTIONNAIRESERVICE_PORT'),
    },
  },
  {
    path:
      publicApiPath +
      'studies/:studyName/participants/:pseudonym/questionnaire-instances',
    upstream: {
      host: 'questionnaireservice',
      path:
        publicUpstreamPath +
        'studies/:studyName/participants/:pseudonym/questionnaire-instances',
      port: ConfigUtils.getEnvVariableInt('QUESTIONNAIRESERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'user/',
    upstream: {
      host: 'userservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('USERSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'user/',
    upstream: {
      host: 'userservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('USERSERVICE_PORT'),
    },
  },
  {
    path: publicApiPath + 'studies/:studyName/participants',
    upstream: {
      host: 'userservice',
      path: publicUpstreamPath + 'studies/:studyName/participants',
      port: ConfigUtils.getEnvVariableInt('USERSERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'notification/',
    upstream: {
      host: 'notificationservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('NOTIFICATIONSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'notification/',
    upstream: {
      host: 'notificationservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('NOTIFICATIONSERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'sample/',
    upstream: {
      host: 'sampletrackingservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('SAMPLETRACKINGSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'sample/',
    upstream: {
      host: 'sampletrackingservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('SAMPLETRACKINGSERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'sormas/',
    upstream: {
      host: 'sormasservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('SORMASSERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'personal/',
    upstream: {
      host: 'personaldataservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('PERSONALDATASERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'personal/',
    upstream: {
      host: 'personaldataservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('PERSONALDATASERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'compliance/',
    upstream: {
      host: 'complianceservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('COMPLIANCESERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'compliance/',
    upstream: {
      host: 'complianceservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('COMPLIANCESERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'log/',
    upstream: {
      host: 'loggingservice',
      path: upstreamPath,
      port: ConfigUtils.getEnvVariableInt('LOGGINGSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'log/',
    upstream: {
      host: 'loggingservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('LOGGINGSERVICE_PORT'),
    },
  },

  {
    path: apiPath + 'feedbackstatistic/',
    upstream: {
      host: 'feedbackstatisticservice',
      path: '/',
      port: ConfigUtils.getEnvVariableInt('FEEDBACKSTATISTICSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'feedbackstatistic/',
    upstream: {
      host: 'feedbackstatisticservice',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('FEEDBACKSTATISTICSERVICE_PORT'),
    },
  },

  {
    path: adminApiPath + 'event-history/',
    upstream: {
      host: 'eventhistoryserver',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('EVENTHISTORYSERVER_PORT'),
    },
  },
  {
    path: publicApiPath + 'event-history',
    upstream: {
      host: 'eventhistoryserver',
      path: publicUpstreamPath + 'event-history',
      port: ConfigUtils.getEnvVariableInt('EVENTHISTORYSERVER_PORT'),
    },
  },

  {
    path: adminApiPath + 'publicapi/',
    upstream: {
      host: 'publicapiserver',
      path: adminUpstreamPath,
      port: ConfigUtils.getEnvVariableInt('PUBLICAPISERVER_PORT'),
    },
  },

  {
    path: apiPath + 'auth/',
    upstream: {
      host: 'authserver',
      path: '/',
      port: ConfigUtils.getEnvVariableInt('AUTHSERVER_PORT'),
    },
  },

  // catch all
  {
    path: '/',
    upstream: {
      host: 'webappserver',
      path: '/',
      port: ConfigUtils.getEnvVariableInt('WEBAPPSERVER_HTTP_PORT'),
    },
  },
];

if (isDevelopment) {
  routes.push({
    path: '/deployment/',
    upstream: {
      host: 'deploymentservice',
      path: '/deployment/',
      port: ConfigUtils.getEnvVariableInt('DEPLOYMENTSERVICE_PORT'),
    },
  });
}

if (!isDevelopment) {
  const responses: ResponseRouteConfig[] = routes.map((route) => {
    return {
      path: route.path + 'metrics',
      response: {
        statusCode: StatusCodes.FORBIDDEN,
      },
    };
  });
  responseRoutes.push(...responses);
}

export default {
  web: {
    internal: {
      port: parseInt(ConfigUtils.getEnvVariable('PORT', '443'), 10),
    },
    external: {
      protocol: ConfigUtils.getEnvVariable('EXTERNAL_PROTOCOL', 'http'),
      port: parseInt(ConfigUtils.getEnvVariable('EXTERNAL_PORT', '80'), 10),
      hostName: ConfigUtils.getEnvVariable('EXTERNAL_HOST_NAME', '_'),
    },
    headers: {
      xFrameOptions: ConfigUtils.getEnvVariable('X_FRAME_OPTIONS', ''),
      contentSecurityPolicy: ConfigUtils.getEnvVariable(
        'CONTENT_SECURITY_POLICY',
        ''
      ),
    },
  },
  system: {
    isDevelopment,
  },
  routes,
  responseRoutes,
};
