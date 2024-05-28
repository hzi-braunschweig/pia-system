/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Connection {
  host: string;
  port: number;
}

export class HttpConnection implements Connection {
  public constructor(public host: string, public port: number) {}

  public get url(): string {
    return `http://${this.host}:${this.port}`;
  }
}

export interface DatabaseConnection extends Connection {
  user: string;
  password: string;
  database: string;
}

export interface MailserverConnection extends Connection {
  user: string;
  password: string;
  requireTLS: boolean;
  from: string;
  name: string;
}

export interface MessageQueueConnection extends Connection {
  username: string;
  password: string;
  serviceName: string;
}

export interface SftpServerConnection extends Connection {
  username: string;
  password: string;
}

export interface AuthSettings {
  probandTokenIntrospectionClient?: AuthClientSettings;
  probandManagementClient?: AuthClientSettings;
  adminTokenIntrospectionClient?: AuthClientSettings;
  adminManagementClient?: AuthClientSettings;
  messageQueueExchange?: string;
}

export interface AuthClientSettings {
  /**
   * The Keycloak connection
   */
  connection: HttpConnection;

  /**
   * ID of the Keycloak realm
   */
  realm: string;

  /**
   * Identifier of the Keycloak client
   */
  clientId: string;

  /**
   * Related secret of the Keycloak client
   */
  secret: string;
}

/**
 * Global schema of service configuration
 */
export interface ServiceConfig {
  public: Connection;
  internal?: Connection;
  database?: DatabaseConnection;
  services?: {
    complianceservice?: HttpConnection;
    loggingservice?: HttpConnection;
    personaldataservice?: HttpConnection;
    userservice?: HttpConnection;
    questionnaireservice?: HttpConnection;
  };
  servers?: {
    mailserver?: MailserverConnection;
    mhhftpserver?: SftpServerConnection;
    hziftpserver?: SftpServerConnection;
    messageQueue?: MessageQueueConnection;
    authserver?: AuthSettings;
  };
  probandAppUrl?: string;
  adminAppUrl?: string;
  backendApiUrl?: string;
}

/**
 * Checks whether all properties existing in C and ServiceConfig meet the types of ServiceConfig.
 * Allows additional config properties. All properties of C are required.
 *
 * Whenever this results in a "Type ... is not assignable to type 'never'" error,
 * you can temporarily assign ServiceConfig as type to your actual configuration object
 * in order get specific type errors.
 */
export type SupersetOfServiceConfig<C> = Required<Extract<C, ServiceConfig>>;
