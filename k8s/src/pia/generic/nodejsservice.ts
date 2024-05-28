/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart, Size } from 'cdk8s';
import { Construct } from 'constructs';
import { Configuration, Variables } from '../../configuration';
import {
  Cpu,
  ImagePullPolicy,
  ISecret,
  Probe,
  Service,
  Volume,
  VolumeMount,
} from 'cdk8s-plus-25';
import { ServiceAccountWithImagePullSecrets } from '../../k8s/serviceAccountWithImagePullSecrets';
import { DeploymentWithoutServiceLinks } from '../../k8s/deploymentWithoutServiceLinks';
import { ServiceMonitor } from '../../k8s/serviceMonitor';

export abstract class NodeJSService extends Chart {
  public readonly service: Service;

  public readonly internalService: Service;

  public constructor(
    scope: Construct,
    configuration: Configuration,
    serviceName: string,
    variables: Variables,
    options?: {
      image?: string;
      files?: Record<
        string,
        {
          secret: ISecret;
          name: string;
        }
      >;
      noProbes?: boolean;
    }
  ) {
    super(scope, serviceName);

    const volumeMounts = Object.entries(options?.files ?? {}).map(
      ([filePath, info]) => {
        const volume = Volume.fromSecret(
          this,
          `volume-${info.name}`,
          info.secret
        );

        const result: VolumeMount = {
          path: filePath,
          volume,
          subPath: info.name,
        };
        return result;
      }
    );

    const deployment = new DeploymentWithoutServiceLinks(this, 'deployment', {
      metadata: { ...configuration.getMetadata(), name: serviceName },
      podMetadata: configuration.getMetadata(),

      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: serviceName },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      replicas: 1,
      containers: [
        {
          image: configuration.getImage(
            options?.image ?? `psa.service.${serviceName}`
          ),

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,

          envVariables: configuration.getVariables(variables),

          ports: [
            {
              number: 4000,
              name: 'http',
            },
            {
              number: 5000,
              name: 'http-internal',
            },
          ],

          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            user: 1000,
            group: 1000,
          },

          ...(options?.noProbes
            ? {}
            : {
                readiness: Probe.fromHttpGet('/health', { port: 4000 }),
                liveness: Probe.fromHttpGet('/health', { port: 4000 }),
              }),

          resources: {
            cpu: {
              request: Cpu.units(0.1),
              limit: Cpu.units(2),
            },
            memory: {
              request: Size.mebibytes(64),
              limit: Size.gibibytes(4),
            },
          },

          volumeMounts: [
            ...volumeMounts,
            {
              path: '/home/node/.npm',
              volume: Volume.fromEmptyDir(this, 'npm-dir', 'npm-dir'),
            },
            // We must have a writeable tmp (e.g. for generating pdf's)
            {
              path: '/tmp',
              volume: Volume.fromEmptyDir(this, 'tmp-dir', 'tmp-dir'),
            },
          ],
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
    this.service.metadata.addLabel('service-name', serviceName);

    this.internalService = new Service(this, 'internal-service', {
      metadata: {
        ...configuration.getMetadata(),
        name: `internal-${serviceName}`,
      },
      ports: [
        {
          port: 5000,
          name: 'http-internal',
        },
      ],
      selector: deployment,
    });

    const serviceMonitor = new ServiceMonitor(this, 'service-monitor', {
      metadata: {
        ...configuration.getMetadata(),
        name: serviceName,
      },
      spec: {
        selector: {
          matchLabels: {
            'service-name': serviceName,
          },
        },
        endpoints: [
          {
            port: 'http',
            path: '/metrics',
            scheme: 'http',
          },
        ],
      },
    });
    serviceMonitor.metadata.addLabel('release', 'kube-prometheus-stack');
  }
}
