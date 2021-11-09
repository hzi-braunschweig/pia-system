/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConfigUtils } from './configUtils';
import {
  Connection,
  DatabaseConnection,
  HttpConnection,
  HttpProtocol,
  MailserverConnection,
  MessageQueueConnection,
  SecureConnection,
  SslCerts,
} from './configModel';

/**
 * Defines configuration which is identical across all services
 *
 * If configuration properties change, they need to be edited here.
 * Services still need to define their own configuration and should
 * use the GlobalConfig as a building block.
 *
 * The global configuration schema is defined here:
 * @see {@link ServiceConfig}
 *
 * @example
 * export const config: ServiceConfig = {
 *     public: GlobalConfig.getPublic(SSL_CERTS),
 *     internal: GlobalConfig.internal,
 *     database: GlobalConfig.getQPia(SSL_CERTS),
 *     publicAuthKey: GlobalConfig.publicAuthKey,
 * };
 */
export class GlobalConfig {
  /**
   * Configuration of the internal API server of a microservice
   */
  public static get internal(): Connection {
    return {
      host: '0.0.0.0',
      port: Number(ConfigUtils.getEnvVariable('INTERNAL_PORT')),
    };
  }

  /**
   * authservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get authservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('AUTHSERVICE');
  }

  /**
   * complianceservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get complianceservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('COMPLIANCESERVICE');
  }

  /**
   * loggingservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get loggingservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('LOGGINGSERVICE');
  }

  /**
   * personaldataservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get personaldataservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('PERSONALDATASERVICE');
  }

  /**
   * personaldataservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get questionnaireservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('QUESTIONNAIRESERVICE');
  }

  /**
   * userservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get userservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('USERSERVICE');
  }

  /**
   * sormasservice http connection
   * @see {@link GlobalConfig#getHttpConnection}
   */
  public static get sormasservice(): HttpConnection {
    return GlobalConfig.getHttpConnection('SORMASSERVICE');
  }

  /**
   * gets the application timeZone
   */
  public static get timeZone(): string {
    return ConfigUtils.getEnvVariable('APPLICATION_TIMEZONE', 'Europe/Berlin');
  }

  /**
   * Global mailserver configuration
   *
   * Will only work, if environment variables are passed to the service
   * which uses the configuration.
   */
  public static get mailserver(): MailserverConnection {
    return {
      host: ConfigUtils.getEnvVariable('MAIL_HOST'),
      port: Number(ConfigUtils.getEnvVariable('MAIL_PORT')),
      user: ConfigUtils.getEnvVariable('MAIL_USER', ''),
      password: ConfigUtils.getEnvVariable('MAIL_PASSWORD', ''),
      requireTLS:
        ConfigUtils.getEnvVariable('MAIL_REQUIRE_TLS', 'true').toLowerCase() !==
        'false',
      from: ConfigUtils.getEnvVariable('MAIL_FROM_ADDRESS'),
      name: ConfigUtils.getEnvVariable('MAIL_FROM_NAME'),
    };
  }

  /**
   * Boolean if SORMAS is activated. Will only return a valid value, if IS_SORMAS_ACTIVE is
   * passed to the service.
   *
   * @deprecated there should be no connection to the sormasservice. Use the messagequeue to communicate with sormas.
   */
  public static get isSormasActive(): boolean {
    return (
      ConfigUtils.getEnvVariable('IS_SORMAS_ACTIVE', 'false').toLowerCase() ===
      'true'
    );
  }

  /**
   * The URL of the web frontend. Will only be available, if WEBAPP_URL is passed to the service.
   */
  public static get webappUrl(): string {
    return ConfigUtils.getEnvVariable('WEBAPP_URL');
  }

  /**
   * The URL of the api backend. Will only be available, if BACKEND_API_URL is passed to the service.
   */
  public static get backendApiUrl(): string {
    return ConfigUtils.getEnvVariable('BACKEND_API_URL');
  }

  /**
   * The URL of the web frontend. Will only be available, if WEBAPP_URL is passed to the service.
   */
  public static get publicAuthKey(): Buffer {
    return ConfigUtils.getFileContent('./authKey/public.pem');
  }

  /**
   * Configuration of the public API server of a microservice
   */
  public static getPublic(sslCerts: SslCerts): SecureConnection {
    return {
      host: '0.0.0.0',
      port: Number(ConfigUtils.getEnvVariable('PORT')),
      tls: ConfigUtils.getEnvVariable('PROTOCOL', 'https') !== 'http' && {
        cert: sslCerts.cert,
        key: sslCerts.key,
        rejectUnauthorized: true,
      },
    };
  }

  /**
   * General settings for a qPIA database connection
   *
   * @description
   * Only the qPia connection is a global connection as it is shared across multiple services.
   *
   * @deprecated should be replaced by service specific db config
   */
  public static getQPia(sslCerts: SslCerts): DatabaseConnection {
    return {
      host: ConfigUtils.getEnvVariable('QPIA_HOST'),
      port: Number(ConfigUtils.getEnvVariable('QPIA_PORT')),
      user: ConfigUtils.getEnvVariable('QPIA_USER'),
      password: ConfigUtils.getEnvVariable('QPIA_PASSWORD'),
      database: ConfigUtils.getEnvVariable('QPIA_DB'),
      ssl: {
        rejectUnauthorized:
          ConfigUtils.getEnvVariable('QPIA_ACCEPT_UNAUTHORIZED', 'false') !==
          'true',
        cert: sslCerts.cert,
        key: sslCerts.key,
        ca: sslCerts.ca,
      },
    };
  }

  /**
   * Returns the connection settings for the messagequeue
   */
  public static getMessageQueue(serviceName: string): MessageQueueConnection {
    return {
      host: ConfigUtils.getEnvVariable('MESSAGEQUEUE_HOST'),
      port: ConfigUtils.getEnvVariableInt('MESSAGEQUEUE_PORT'),
      serviceName,
      username: ConfigUtils.getEnvVariable('MESSAGEQUEUE_APP_USER'),
      password: ConfigUtils.getEnvVariable('MESSAGEQUEUE_APP_PASSWORD'),
    };
  }

  /**
   * Configuration for inter-service communication to the given service
   *
   * Will only work, if environment variables are passed to the service
   * which uses the configuration.
   */
  private static getHttpConnection(servicePrefix: string): HttpConnection {
    return new HttpConnection(
      ConfigUtils.getEnvVariable('INTERNAL_PROTOCOL', 'http') as HttpProtocol,
      ConfigUtils.getEnvVariable(servicePrefix + '_HOST'),
      Number(ConfigUtils.getEnvVariable(servicePrefix + '_INTERNAL_PORT'))
    );
  }
}
