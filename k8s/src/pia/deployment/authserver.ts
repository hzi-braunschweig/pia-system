/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart, Size } from 'cdk8s';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { Cpu, ImagePullPolicy, Service } from 'cdk8s-plus-25';
import { ServiceAccountWithImagePullSecrets } from '../../k8s/serviceAccountWithImagePullSecrets';
import { IPiaService } from '../stateful/ipiaservice';
import { MessageQueue } from '../stateful/messagequeue';
import { DeploymentWithoutServiceLinks } from '../../k8s/deploymentWithoutServiceLinks';

export class Authserver extends Chart {
  public readonly service: Service;

  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      ipiaService,
      messageQueue,
    }: {
      ipiaService: IPiaService;
      messageQueue: MessageQueue;
    }
  ) {
    const serviceName = 'authserver';
    super(scope, serviceName);

    const deployment = new DeploymentWithoutServiceLinks(this, 'deployment', {
      podMetadata: { ...configuration.getMetadata(), name: 'authserver' },
      metadata: { ...configuration.getMetadata(), name: 'authserver' },

      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: 'authserver' },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      replicas: 1,

      containers: [
        {
          image: configuration.getImage('psa.server.auth'),

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,

          envVariables: configuration.getVariables({
            KEYCLOAK_ADMIN: 'admin',
            KEYCLOAK_ADMIN_PASSWORD:
              configuration.variables.authserverAdminPassword,

            DB_AUTHSERVER_HOST: ipiaService.service.name,
            DB_AUTHSERVER_PORT: ipiaService.service.port,
            DB_AUTHSERVER_USER: configuration.variables.authserverUser,
            DB_AUTHSERVER_PASSWORD: configuration.variables.authserverPassword,
            DB_AUTHSERVER_DB: configuration.variables.authserverDb,

            MAIL_HOST: configuration.variables.mail.host,
            MAIL_PORT: configuration.variables.mail.port,
            MAIL_USER: configuration.variables.mail.user,
            MAIL_PASSWORD: configuration.variables.mail.password,
            MAIL_REQUIRE_TLS: configuration.variables.mail.requireTls,
            MAIL_FROM_ADDRESS: configuration.variables.mail.fromAddress,
            MAIL_FROM_NAME: configuration.variables.mail.fromName,

            AUTHSERVER_PROBAND_MANAGEMENT_CLIENT_SECRET:
              configuration.variables.authserver.probandManagementClientSecret,

            AUTHSERVER_ADMIN_MANAGEMENT_CLIENT_SECRET:
              configuration.variables.authserver.adminManagementClientSecret,

            AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET:
              configuration.variables.authserver
                .probandTokenIntrospectionClientSecret,

            AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
              configuration.variables.authserver
                .adminTokenIntrospectionClientSecret,
            AUTHSERVER_PROBAND_TERMS_OF_SERVICE_URL:
              configuration.variables.authserver.probandTermsOfServiceUrl,
            AUTHSERVER_PROBAND_POLICY_URL:
              configuration.variables.authserver.probandPolicyUrl,

            KK_TO_RMQ_URL: messageQueue.service.name,
            KK_TO_RMQ_PORT: messageQueue.service.port,

            KK_TO_RMQ_USERNAME: configuration.variables.messageQueue.appUser,
            KK_TO_RMQ_PASSWORD:
              configuration.variables.messageQueue.appPassword,
            KK_TO_RMQ_EXCHANGE:
              configuration.variables.authserver.messageQueueExchange,
            KK_TO_RMQ_VHOST: '/',

            WEBAPP_URL: configuration.variables.webappUrl,
            EXTERNAL_PROTOCOL: configuration.variables.externalProtocol,

            EXTERNAL_PORT: configuration.variables.externalPort,

            EXTERNAL_HOST: configuration.variables.externalHost,
            IS_DEVELOPMENT_SYSTEM: configuration.variables.isDevelopmentSystem,
            IS_DIRECT_ACCESS_GRANT_ENABLED:
              configuration.variables.isDevelopmentSystem,
            USER_PASSWORD_LENGTH: configuration.variables.userPasswordLength,
          }),

          ports: [
            {
              number: 4000,
              name: 'http',
            },
          ],

          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            // application is writing to /opt/keycloak/lib/quarkus/ but there is also static stuff
            readOnlyRootFilesystem: false,
          },

          resources: {
            cpu: {
              limit: Cpu.units(4),
              request: Cpu.units(1),
            },
            memory: {
              limit: Size.gibibytes(4),
              request: Size.gibibytes(0.5),
            },
          },
        },
      ],
    });

    this.service = new Service(this, 'service', {
      metadata: {
        ...configuration.getMetadata(),
        name: serviceName,
      },
      ports: [
        {
          port: 4000,
          name: 'http',
        },
      ],
      selector: deployment,
    });
  }
}
