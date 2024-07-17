/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import assert from 'assert';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { Chart, Size } from 'cdk8s';
import {
  Cpu,
  ImagePullPolicy,
  Ingress,
  IngressBackend,
  Secret,
  Service,
  Volume,
} from 'cdk8s-plus-25';
import { ServiceAccountWithImagePullSecrets } from '../../k8s/serviceAccountWithImagePullSecrets';
import { EventHistoryServer } from './eventhistoryserver';
import { PublicApiServer } from './publicapiserver';
import { WebappServer } from './webappserver';
import { Authserver } from './authserver';
import { UserService } from './userservice';
import { DeploymentWithoutServiceLinks } from '../../k8s/deploymentWithoutServiceLinks';
import { LoggingService } from './loggingservice';
import { PersonaldataService } from './personaldataservice';
import { ModysService } from './modysservice';
import { ComplianceService } from './complianceservice';
import { QuestionnaireService } from './questionnaireservice';
import { AnalyzerService } from './analyzerservice';
import { NotificationService } from './notificationservice';
import { SampleTrackingService } from './sampletrackingservice';
import { FeedbackStatisticService } from './feedbackstatisticservice';
import { SormasService } from './sormasservice';
import { IngressWithIngressClassName } from '../../k8s/ingressWithIngressClassName';

export class ApiGateway extends Chart {
  public readonly ingress: Ingress;

  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      webappServer,
      authServer,
      userService,
      loggingService,
      personalDataService,
      modysService,
      complianceService,
      questionnaireService,
      analyzerService,
      notificationService,
      sampleTrackingService,
      feedbackStatisticService,
      sormasService,
      publicApiServer,
      eventHistoryServer,
    }: {
      webappServer: WebappServer;
      authServer: Authserver;
      userService: UserService;
      loggingService: LoggingService;
      personalDataService: PersonaldataService;
      modysService: ModysService;
      complianceService: ComplianceService;
      questionnaireService: QuestionnaireService;
      analyzerService: AnalyzerService;
      notificationService: NotificationService;
      sampleTrackingService: SampleTrackingService;
      feedbackStatisticService: FeedbackStatisticService;
      sormasService: SormasService;
      publicApiServer: PublicApiServer;
      eventHistoryServer: EventHistoryServer;
    }
  ) {
    const serviceName = 'apigateway';
    super(scope, serviceName);

    // assert routing names on services because they are hardcoded inside the apigateway
    assert.strictEqual(webappServer.service.name, 'webappserver');
    assert.strictEqual(authServer.service.name, 'authserver');
    assert.strictEqual(userService.service.name, 'userservice');
    assert.strictEqual(personalDataService.service.name, 'personaldataservice');
    assert.strictEqual(loggingService.service.name, 'loggingservice');
    assert.strictEqual(modysService.service.name, 'modysservice');
    assert.strictEqual(complianceService.service.name, 'complianceservice');
    assert.strictEqual(
      questionnaireService.service.name,
      'questionnaireservice'
    );
    assert.strictEqual(analyzerService.service.name, 'analyzerservice');
    assert.strictEqual(notificationService.service.name, 'notificationservice');
    assert.strictEqual(
      sampleTrackingService.service.name,
      'sampletrackingservice'
    );
    assert.strictEqual(
      feedbackStatisticService.service.name,
      'feedbackstatisticservice'
    );
    assert.strictEqual(sormasService.service.name, 'sormasservice');
    assert.strictEqual(publicApiServer.service.name, 'publicapiserver');
    assert.strictEqual(eventHistoryServer.service.name, 'eventhistoryserver');

    const deployment = new DeploymentWithoutServiceLinks(this, 'deployment', {
      podMetadata: configuration.getMetadata(),
      metadata: { ...configuration.getMetadata(), name: 'apigateway' },

      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: 'apigateway' },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      replicas: 2,

      containers: [
        {
          image: configuration.getImage('psa.server.apigateway'),

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
          envVariables: configuration.getVariables({
            // unused...
            WEBAPPSERVER_HTTP_PORT: 80,
            USERSERVICE_PORT: userService.service.port,
            QUESTIONNAIRESERVICE_PORT: questionnaireService.service.port,
            NOTIFICATIONSERVICE_PORT: notificationService.service.port,
            SAMPLETRACKINGSERVICE_PORT: sampleTrackingService.service.port,
            PERSONALDATASERVICE_PORT: personalDataService.service.port,
            LOGGINGSERVICE_PORT: loggingService.service.port,
            MODYSSERVICE_PORT: modysService.service.port,
            COMPLIANCESERVICE_PORT: complianceService.service.port,
            ANALYZERSERVICE_PORT: analyzerService.service.port,
            SORMASSERVICE_PORT: sormasService.service.port,
            FEEDBACKSTATISTICSERVICE_PORT:
              feedbackStatisticService.service.port,
            AUTHSERVER_PORT: authServer.service.port,
            PUBLICAPISERVER_PORT: publicApiServer.service.port,
            EVENTHISTORYSERVER_PORT: eventHistoryServer.service.port,

            X_FRAME_OPTIONS: configuration.variables.xFrameOptions,
            CONTENT_SECURITY_POLICY:
              configuration.variables.contentSecurityPolicy,

            IS_DEVELOPMENT_SYSTEM: configuration.variables.isDevelopmentSystem,

            EXTERNAL_PROTOCOL: 'http',

            EXTERNAL_PORT: 80,
          }),

          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            user: 1000,
            group: 1000,
          },

          resources: {
            cpu: {
              limit: Cpu.units(2),
              request: Cpu.units(1),
            },
            memory: {
              limit: Size.gibibytes(1),
              request: Size.gibibytes(0.5),
            },
          },

          ports: [
            {
              name: 'http',
              number: 80,
            },
          ],

          volumeMounts: [
            {
              path: '/home/node/.npm',
              volume: Volume.fromEmptyDir(this, 'npm-dir', 'npm-dir'),
            },
          ],
        },
      ],
    });

    const service = new Service(this, 'service', {
      metadata: { ...configuration.getMetadata(), name: 'apigateway' },
      ports: [
        {
          name: 'http',
          port: 80,
        },
      ],
      selector: deployment,
    });

    this.ingress = new IngressWithIngressClassName(this, 'ingress', {
      metadata: {
        ...configuration.getMetadata(),
        name: serviceName,
      },
      ingressClassName: configuration.ingressClassName,
      tls: [
        {
          hosts: [configuration.ingressHost],
          secret: Secret.fromSecretName(this, 'tls', 'ingress-tls'),
        },
      ],
      rules: [
        {
          host: configuration.ingressHost,
          backend: IngressBackend.fromService(service),
        },
      ],
    });
  }
}
