/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart, Size } from 'cdk8s';
import { Volume, ImagePullPolicy, Cpu, Job } from 'cdk8s-plus-25';
import { Construct } from 'constructs';
import { Configuration } from '../configuration';
import { ServiceAccountWithImagePullSecrets } from '../k8s/serviceAccountWithImagePullSecrets';

export class Precheck extends Chart {
  public job: Job;

  public constructor(scope: Construct, configuration: Configuration) {
    super(scope, 'precheck');

    const internalSecretsVolume = Volume.fromSecret(
      this,
      'internal-secrets-volume',
      configuration.internalSecret
    );
    const piaConfigVolume = Volume.fromSecret(
      this,
      'pia-config-volume',
      configuration.configSecret
    );

    this.job = new Job(this, 'pia-precheck', {
      metadata: {
        ...configuration.getMetadata(),
        name: 'pia-precheck',
        annotations: {
          'argocd.argoproj.io/hook': 'PreSync',
          'argocd.argoproj.io/hook-delete-policy': 'BeforeHookCreation',
        },
      },
      podMetadata: configuration.getMetadata(),

      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: 'pia-precheck' },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),
      containers: [
        {
          image: configuration.getImage('k8s'),
          args: ['precheck', '/internal-secrets', '/pia-config'],

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            user: 1000,
            group: 1000,
          },

          resources: {
            cpu: {
              request: Cpu.units(0.1),
              limit: Cpu.units(1),
            },
            memory: {
              request: Size.mebibytes(128),
              limit: Size.mebibytes(128),
            },
          },

          volumeMounts: [
            {
              path: '/internal-secrets',
              volume: internalSecretsVolume,
              readOnly: true,
            },
            {
              path: '/pia-config',
              volume: piaConfigVolume,
              readOnly: true,
            },
          ],
        },
      ],
    });
  }
}
