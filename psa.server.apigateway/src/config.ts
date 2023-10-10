/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProxyRoute, ResponseRoute } from './proxyRoute';
import { ConfigUtils } from '@pia/lib-service-core';
import { nonExposedKeycloakPaths } from './nonExposedKeycloakPaths';

const publicApiPath = '/api/v1/';
const adminApiPath = '/admin/api/v1/';

const publicUpstreamPath = '/';
const adminUpstreamPath = '/admin/';

const isDevelopment =
  ConfigUtils.getEnvVariable('IS_DEVELOPMENT_SYSTEM', 'false').toLowerCase() ===
  'true';
const isInternalSslEnabled =
  ConfigUtils.getEnvVariable('PROTOCOL', 'https') !== 'http';

function getProtocol(): 'https' | 'http' {
  return isInternalSslEnabled ? 'https' : 'http';
}

const publicMetaData = {
  minimalAppVersion: '1.29.19',
};

const responseRoutes: ResponseRoute[] = [
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

const routes: ProxyRoute[] = [
  {
    path: publicApiPath + 'questionnaire/',
    upstream: {
      host: 'questionnaireservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('QUESTIONNAIRESERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'questionnaire/',
    upstream: {
      host: 'questionnaireservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('QUESTIONNAIRESERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'user/',
    upstream: {
      host: 'userservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('USERSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'user/',
    upstream: {
      host: 'userservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('USERSERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'notification/',
    upstream: {
      host: 'notificationservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('NOTIFICATIONSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'notification/',
    upstream: {
      host: 'notificationservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('NOTIFICATIONSERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'sample/',
    upstream: {
      host: 'sampletrackingservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('SAMPLETRACKINGSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'sample/',
    upstream: {
      host: 'sampletrackingservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('SAMPLETRACKINGSERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'sormas/',
    upstream: {
      host: 'sormasservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('SORMASSERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'personal/',
    upstream: {
      host: 'personaldataservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('PERSONALDATASERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'personal/',
    upstream: {
      host: 'personaldataservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('PERSONALDATASERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'compliance/',
    upstream: {
      host: 'complianceservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('COMPLIANCESERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'compliance/',
    upstream: {
      host: 'complianceservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('COMPLIANCESERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'log/',
    upstream: {
      host: 'loggingservice',
      path: publicUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('LOGGINGSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'log/',
    upstream: {
      host: 'loggingservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('LOGGINGSERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'feedbackstatistic/',
    upstream: {
      host: 'feedbackstatisticservice',
      protocol: getProtocol(),
      path: '/',
      port: ConfigUtils.getEnvVariableInt('FEEDBACKSTATISTICSERVICE_PORT'),
    },
  },
  {
    path: adminApiPath + 'feedbackstatistic/',
    upstream: {
      host: 'feedbackstatisticservice',
      path: adminUpstreamPath,
      protocol: getProtocol(),
      port: ConfigUtils.getEnvVariableInt('FEEDBACKSTATISTICSERVICE_PORT'),
    },
  },

  {
    path: publicApiPath + 'auth/',
    upstream: {
      host: 'authserver',
      protocol: 'https',
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
      protocol: getProtocol(),
      port:
        ConfigUtils.getEnvVariable('PROTOCOL', 'https') === 'http'
          ? ConfigUtils.getEnvVariableInt('WEBAPPSERVER_HTTP_PORT')
          : ConfigUtils.getEnvVariableInt('WEBAPPSERVER_HTTPS_PORT'),
    },
  },
];

if (isDevelopment) {
  routes.push({
    path: '/deployment/',
    upstream: {
      host: 'deploymentservice',
      path: '/deployment/',
      protocol: 'http',
      port: ConfigUtils.getEnvVariableInt('DEPLOYMENTSERVICE_PORT'),
    },
  });
}

export default {
  web: {
    internal: {
      protocol: ConfigUtils.getEnvVariable('PROTOCOL', 'https'),
      port: parseInt(ConfigUtils.getEnvVariable('PORT', '443'), 10),
      ssl: {
        ca: ConfigUtils.getEnvVariable('SSL_CA', '/etc/ssl/ca.cert'),
      },
    },
    external: {
      protocol: ConfigUtils.getEnvVariable('EXTERNAL_PROTOCOL', 'https'),
      port: parseInt(ConfigUtils.getEnvVariable('EXTERNAL_PORT', '443'), 10),
      hostName: ConfigUtils.getEnvVariable('EXTERNAL_HOST_NAME', '_'),
      ssl: {
        certificate: ConfigUtils.getEnvVariable(
          'SSL_CERTIFICATE',
          '/etc/ssl/api.cert'
        ),
        key: ConfigUtils.getEnvVariable(
          'SSL_CERTIFICATE_KEY',
          '/etc/ssl/api.key'
        ),
      },
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
