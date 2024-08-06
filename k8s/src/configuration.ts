/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ApiObjectMetadata, Chart } from 'cdk8s';
import {
  ContainerSecurityContextProps,
  EnvValue,
  ISecret,
  Secret,
} from 'cdk8s-plus-25';
import { Construct } from 'constructs';
import { InternalSecrets } from './pia/internalSecrets';
import { PiaConfig } from './pia/piaConfig';
import * as fs from 'fs';

export type Variables = Record<string, string | boolean | number | EnvValue>;

const PIA_IMAGES: string[] = [
  'k8s',
  'psa.database',
  'psa.database.ewpia',
  'psa.database.ipia',
  'psa.server.messagequeue',
  'psa.server.auth',
  'psa.app.web',
  'psa.service.userservice',
  'psa.service.loggingservice',
  'psa.service.personaldataservice',
  'psa.service.modysservice',
  'psa.service.complianceservice',
  'psa.service.sampletrackingservice',
  'psa.server.publicapi',
  'psa.server.eventhistory',
  'psa.service.questionnaireservice',
  'psa.service.analyzerservice',
  'psa.service.notificationservice',
  'psa.service.feedbackstatisticservice',
  'psa.service.sormasservice',
  'psa.server.apigateway',
  'psa.server.autheventproxy',
  'psa.server.mailserver',
  'psa.server.jobscheduler',
];

export class Configuration extends Chart {
  public readonly configSecret = Secret.fromSecretName(
    this,
    'pia-config',
    'pia-config'
  );

  public readonly internalSecret = InternalSecrets.getSecret(this);

  public readonly dockerConfigSecret: ISecret;

  public readonly piaVersion: string = Configuration.getPiaVersion();

  public readonly storageClassName = undefined;
  public readonly ingressClassName = undefined;
  public readonly ingressHost = 'pia-app';
  public readonly mailhogHost = 'mailhog';

  public readonly variables = {
    qpia: {
      user: 'superuser',
      password: InternalSecrets.getPassword(
        this.internalSecret,
        'qpia_superuser_db'
      ),
      db: 'pia_database',
    },

    ewpia: {
      user: 'superuser',
      password: InternalSecrets.getPassword(
        this.internalSecret,
        'ewpia_supersuser_db'
      ),
      db: 'pia_database',
    },

    ipia: {
      user: 'superuser',
      password: InternalSecrets.getPassword(
        this.internalSecret,
        'ipia_superuser_db'
      ),
      db: 'pia_database',
    },

    logUser: 'loggingservice',
    logPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'loggingservice_db'
    ),

    sormasUser: 'sormasservice',
    sormasPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'sormasservice_db'
    ),

    feedbackStatisticUser: 'feedbackstatisticservice',
    feedbackStatisticPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'feedbackstatisticservice_db'
    ),

    eventHistoryUser: 'eventhistoryserver',
    eventHistoryPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'eventhistoryserver_db'
    ),

    personaldataUser: 'personaldataservice',
    personaldataPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'personaldataservice_db'
    ),

    authserverUser: 'authserver',
    authserverPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'authserver_db'
    ),
    authserverDb: 'pia_database',

    // the keycloak application is not updating that password from the env to the db
    // therefore there is currently no easy way to update that
    authserverAdminPassword: InternalSecrets.getPassword(
      this.internalSecret,
      'authserver_admin_user'
    ),

    authserver: {
      probandManagementClientSecret: InternalSecrets.getPassword(
        this.internalSecret,
        'authserver_proband_management_client_secret'
      ),
      adminManagementClientSecret: InternalSecrets.getPassword(
        this.internalSecret,
        'authserver_admin_management_client_secret'
      ),
      probandTokenIntrospectionClientSecret: InternalSecrets.getPassword(
        this.internalSecret,
        'authserver_proband_token_introspection_client_secret'
      ),
      adminTokenIntrospectionClientSecret: InternalSecrets.getPassword(
        this.internalSecret,
        'authserver_admin_token_introspection_client_secret'
      ),
      probandTermsOfServiceUrl: PiaConfig.getConfig(
        this.configSecret,
        'probandTermsOfServiceUrl'
      ),
      probandPolicyUrl: PiaConfig.getConfig(
        this.configSecret,
        'probandPolicyUrl'
      ),

      // fixed; do not change
      messageQueueExchange: 'keycloak.events',
    },

    mail: {
      host: PiaConfig.getConfig(this.configSecret, 'mailServerHostName'),
      port: PiaConfig.getConfig(this.configSecret, 'mailServerPort'),
      user: PiaConfig.getConfig(this.configSecret, 'mailServerUserName'),
      password: PiaConfig.getConfig(this.configSecret, 'mailServerPassword'),
      requireTls: PiaConfig.getConfig(
        this.configSecret,
        'mailServerRequireTls'
      ),
      fromAddress: PiaConfig.getConfig(
        this.configSecret,
        'mailServerFromAddress'
      ),
      fromName: PiaConfig.getConfig(this.configSecret, 'mailServerFromName'),
    },

    modys: {
      baseUrl: PiaConfig.getConfig(this.configSecret, 'modysBaseUrl'),
      userName: PiaConfig.getConfig(this.configSecret, 'modysUserName'),
      password: PiaConfig.getConfig(this.configSecret, 'modysPassword'),
      study: PiaConfig.getConfig(this.configSecret, 'modysStudy'),
      identifierTypeId: PiaConfig.getConfig(
        this.configSecret,
        'modysIdentifierTypeId'
      ),
      requestConcurrency: PiaConfig.getConfig(
        this.configSecret,
        'modysRequestConcurrency'
      ),
    },

    webappUrl: PiaConfig.getConfig(this.configSecret, 'webappUrl'),
    externalProtocol: PiaConfig.getConfig(
      this.configSecret,
      'externalProtocol'
    ),
    externalPort: PiaConfig.getConfig(this.configSecret, 'externalPort'),
    externalHost: PiaConfig.getConfig(this.configSecret, 'externalHost'),

    isSormasEnabled: PiaConfig.getConfig(this.configSecret, 'isSormasEnabled'),

    // NEVER SET THIS ON ANY SYSTEM THAT COULD CONTAIN SENSITIVE DATA!
    isDevelopmentSystem: false,

    userPasswordLength: PiaConfig.getConfig(
      this.configSecret,
      'userPasswordLength'
    ),

    messageQueue: {
      adminPassword: InternalSecrets.getPassword(
        this.internalSecret,
        'messagequeue_admin'
      ),
      appPassword: InternalSecrets.getPassword(
        this.internalSecret,
        'messagequeue_app'
      ),
      appUser: 'app',
    },

    firebaseCredential: {
      privateKeyBase64: PiaConfig.getConfig(
        this.configSecret,
        'firebasePrivateKeyBase64'
      ),
      projectId: PiaConfig.getConfig(this.configSecret, 'firebaseProjectId'),
      clientEmail: PiaConfig.getConfig(
        this.configSecret,
        'firebaseClientEmail'
      ),
    },

    mailhogAuth: PiaConfig.getConfigFile(this.configSecret, 'mailhogAuth'),

    /**
     * The X-frame-options header that should be set for the web app
     *
     * X-Frame-Options are only needed for older browsers which do not support CSP
     *
     * @link https://developer.mozilla.org/de/docs/Web/HTTP/Headers/X-Frame-Options
     */
    xFrameOptions: '',

    /**
     * The Content-Security-Policy Header that should be set for the web app
     *
     * @example
     * contentSecurityPolicy: "default-src 'self'; frame-ancestors page-which-is-not-self.com 'self'"
     *
     * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
     */
    contentSecurityPolicy: '',

    defaultLanguage: PiaConfig.getConfig(this.configSecret, 'defaultLanguage'),
  };

  public constructor(scope: Construct, id: string) {
    super(scope, id);
    this.dockerConfigSecret = Secret.fromSecretName(
      this,
      'docker-registry',
      'docker-registry'
    );
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private static getPiaVersion(): string {
    const envName = 'PIA_VERSION';
    const versionFromEnv = process.env[envName];
    if (versionFromEnv) {
      console.warn(`using version ${versionFromEnv} from env ${envName}`);
      return versionFromEnv;
    }

    const versionFile = '../VERSION';
    if (fs.existsSync(versionFile)) {
      const versionFromFile = fs.readFileSync(versionFile).toString();
      console.warn(`using version ${versionFromFile} from file ${versionFile}`);
      return versionFromFile;
    }

    console.warn('fallback to "latest" version');
    return 'latest';
  }

  public getDefaultSecurityContext(): ContainerSecurityContextProps {
    return {
      ensureNonRoot: true,
      readOnlyRootFilesystem: true,
      allowPrivilegeEscalation: false,
    };
  }

  public getImage(name: string): string {
    if (!PIA_IMAGES.includes(name)) {
      throw new Error(`please add ${name} to PIA_IMAGES before using it`);
    }
    return `registry.hzdr.de/pia-eresearch-system/pia/${name}:${this.piaVersion}`;
  }

  public getAllImages(): string[] {
    return PIA_IMAGES.map((image) => this.getImage(image));
  }

  public getMetadata(): ApiObjectMetadata {
    return {
      annotations: {},
      labels: {
        app: 'pia',
      },
    };
  }

  public getVariables(variables: Variables): Record<string, EnvValue> {
    const result: Record<string, EnvValue> = {};

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        result[key] = { value };
        continue;
      }
      if (typeof value === 'number') {
        result[key] = { value: value.toString() };
        continue;
      }
      if (typeof value === 'boolean') {
        result[key] = { value: value ? 'true' : 'false' };
        continue;
      }
      if (value instanceof EnvValue) {
        result[key] = value;
        continue;
      }
      throw new Error(`invalid variable type ${typeof value} for ${key}`);
    }

    return result;
  }
}
