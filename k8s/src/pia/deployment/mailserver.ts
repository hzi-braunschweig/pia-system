/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart, Size } from 'cdk8s';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
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
import { DeploymentWithoutServiceLinks } from '../../k8s/deploymentWithoutServiceLinks';
import { IngressWithIngressClassName } from '../../k8s/ingressWithIngressClassName';

export class MailServer extends Chart {
  public readonly service: Service;

  public readonly ingress: Ingress;

  // only for testing environments!
  public constructor(scope: Construct, configuration: Configuration) {
    super(scope, 'mailserver');

    const authMountPath = '/auth.config';
    const authFile = configuration.variables.mailhogAuth;

    const deployment = new DeploymentWithoutServiceLinks(this, 'deployment', {
      metadata: { ...configuration.getMetadata(), name: 'mailserver' },

      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: 'mailserver' },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      replicas: 1,

      containers: [
        {
          image: configuration.getImage('psa.server.mailserver'),

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,

          args: [`-auth-file=${authMountPath}`],

          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            // mailhog user
            user: 1000,
            group: 1000,
          },

          resources: {
            cpu: {
              limit: Cpu.units(1),
              request: Cpu.units(0.2),
            },
            memory: {
              limit: Size.gibibytes(1),
              request: Size.gibibytes(0.25),
            },
          },

          ports: [
            {
              name: 'smtp',
              number: 1025,
            },
            {
              name: 'http',
              number: 8025,
            },
          ],
          volumeMounts: [
            {
              volume: Volume.fromSecret(this, 'auth-file', authFile.secret),
              path: authMountPath,
              subPath: authFile.name,
            },
          ],
        },
      ],
    });

    this.service = new Service(this, 'service', {
      metadata: { ...configuration.getMetadata(), name: 'mailserver' },
      ports: [
        {
          port: 1025,
        },
      ],
      selector: deployment,
    });

    const webService = new Service(this, 'web', {
      metadata: { ...configuration.getMetadata(), name: 'mailserver-ui' },
      ports: [
        {
          port: 8025,
        },
      ],
      selector: deployment,
    });

    this.ingress = new IngressWithIngressClassName(this, 'ingress', {
      metadata: {
        ...configuration.getMetadata(),
        name: 'mailhog',
      },
      ingressClassName: configuration.ingressClassName,
      tls: [
        {
          hosts: [configuration.mailhogHost],
          secret: Secret.fromSecretName(this, 'tls', 'ingress-mailhog-tls'),
        },
      ],
      rules: [
        {
          host: configuration.mailhogHost,
          backend: IngressBackend.fromService(webService),
        },
      ],
    });
  }
}
