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
import { DeploymentWithoutServiceLinks } from '../../k8s/deploymentWithoutServiceLinks';

export class WebappServer extends Chart {
  public readonly service: Service;

  public constructor(scope: Construct, configuration: Configuration) {
    const serviceName = 'webappserver';
    super(scope, serviceName);

    const deployment = new DeploymentWithoutServiceLinks(this, 'deployment', {
      podMetadata: configuration.getMetadata(),
      metadata: { ...configuration.getMetadata(), name: 'webappserver' },

      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: 'webappserver' },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      replicas: 2,

      containers: [
        {
          image: configuration.getImage('psa.app.web'),

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,

          envVariables: configuration.getVariables({
            DEFAULT_LANGUAGE: configuration.variables.defaultLanguage,
            IS_DEVELOPMENT_SYSTEM: configuration.variables.isDevelopmentSystem,
            WEBAPPSERVER_HTTP_PORT: 80,
            IS_SORMAS_ENABLED: configuration.variables.isSormasEnabled,
          }),

          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },

          resources: {
            cpu: {
              limit: Cpu.units(1),
              request: Cpu.units(0.5),
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
        },
      ],
    });

    this.service = new Service(this, 'service', {
      metadata: { ...configuration.getMetadata(), name: serviceName },
      ports: [
        {
          port: 80,
        },
      ],
      selector: deployment,
    });
  }
}
