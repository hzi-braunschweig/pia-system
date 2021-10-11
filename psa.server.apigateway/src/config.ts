/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConfigRoute } from './configRoute';

const adminPath = '/admin';
const apiPath = '/api/v1';
const adminApiPath = '/admin/api/v1';

function getNumberIfDefined(value: string | undefined): number | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  const result = Number.parseInt(value);
  if (Number.isNaN(result)) {
    return undefined;
  }
  return result;
}

function getEnvVariable(key: string, fallback?: string): string {
  const result = process.env[key];
  if (result === undefined) {
    if (fallback || fallback === '') {
      return fallback;
    }
    throw new Error(`missing config variable '${key}'`);
  }
  return result;
}

const routes: ConfigRoute[] = [
  // temporary redirects for backward compatibility
  {
    serviceName: 'userservice',
    path: '/user/probands',
    additionalPaths: [],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['USERSERVICE_PORT']),
    // we need to keep that until NatCoEdc has changed it
    skipBasePath: false,
  },
  {
    serviceName: 'authservice',
    path: '/user/connectSormas',
    additionalPaths: [],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    // we need to keep that until SORMAS has changed it
    skipBasePath: false,
  },
  {
    serviceName: 'authservice',
    path: '/user/requestToken',
    additionalPaths: [],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    // we need to keep that until SORMAS has changed it
    skipBasePath: false,
  },

  {
    serviceName: 'authservice',
    path: '/user/changePassword',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'authservice',
    path: '/user/login',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'authservice',
    path: '/user/loginWithKey',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'authservice',
    path: '/user/logout',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'authservice',
    path: '/user/newPassword',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    skipBasePath: true,
  },

  {
    serviceName: 'authservice',
    path: '/auth/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['AUTHSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'questionnaireservice',
    path: '/questionnaire/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['QUESTIONNAIRESERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'userservice',
    path: '/user/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['USERSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'notificationservice',
    path: '/notification/',
    isHttpOnly: false,
    additionalPaths: [apiPath, adminApiPath],
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['NOTIFICATIONSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'sampletrackingservice',
    path: '/sample/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['SAMPLETRACKINGSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'personaldataservice',
    path: '/personal/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['PERSONALDATASERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'complianceservice',
    path: '/compliance/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['COMPLIANCESERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'loggingservice',
    path: '/log/',
    additionalPaths: [apiPath, adminApiPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port: getNumberIfDefined(process.env['LOGGINGSERVICE_PORT']),
    skipBasePath: true,
  },
  {
    serviceName: 'webappserver',
    path: '/web/',
    additionalPaths: [adminPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port:
      getEnvVariable('PROTOCOL', 'https') === 'http'
        ? getNumberIfDefined(process.env['WEBAPPSERVER_HTTP_PORT'])
        : getNumberIfDefined(process.env['WEBAPPSERVER_HTTPS_PORT']),
  },
  {
    serviceName: 'deploymentservice',
    path: '/deployment/',
    additionalPaths: [apiPath],
    isHttpOnly: true,
    isOnlyOnDevelopmentSystems: true,
    port: getNumberIfDefined(process.env['DEPLOYMENTSERVICE_PORT']),
  },

  // catch all
  {
    serviceName: 'webappserver',
    path: '/',
    additionalPaths: [adminPath],
    isHttpOnly: false,
    isOnlyOnDevelopmentSystems: false,
    port:
      getEnvVariable('PROTOCOL', 'https') === 'http'
        ? getNumberIfDefined(process.env['WEBAPPSERVER_HTTP_PORT'])
        : getNumberIfDefined(process.env['WEBAPPSERVER_HTTPS_PORT']),
  },
];

export default {
  web: {
    internal: {
      protocol: getEnvVariable('PROTOCOL', 'https'),
      port: parseInt(getEnvVariable('PORT', '443'), 10),
      ssl: {
        ca: getEnvVariable('SSL_CA', '/etc/ssl/ca.cert'),
      },
    },
    external: {
      protocol: getEnvVariable('EXTERNAL_PROTOCOL', 'https'),
      port: parseInt(getEnvVariable('EXTERNAL_PORT', '443'), 10),
      hostName: getEnvVariable('EXTERNAL_HOST_NAME', '_'),
      ssl: {
        certificate: getEnvVariable('SSL_CERTIFICATE', '/etc/ssl/api.cert'),
        key: getEnvVariable('SSL_CERTIFICATE_KEY', '/etc/ssl/api.key'),
      },
    },
    headers: {
      xFrameOptions: getEnvVariable('X_FRAME_OPTIONS', ''),
      contentSecurityPolicy: getEnvVariable('CONTENT_SECURITY_POLICY', ''),
    },
  },
  system: {
    isDevelopment:
      getEnvVariable('IS_DEVELOPMENT_SYSTEM', 'false').toLowerCase() === 'true',
  },
  publicMetaData: {
    minimalAppVersion: '1.27.0',
  },
  routes,
};
