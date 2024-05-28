/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart, Size } from 'cdk8s';
import {
  Cpu,
  EnvValue,
  ImagePullPolicy,
  PersistentVolumeAccessMode,
  PersistentVolumeClaim,
  Service,
  Volume,
} from 'cdk8s-plus-25';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { ServiceAccountWithImagePullSecrets } from '../../k8s/serviceAccountWithImagePullSecrets';
import { StatefulSetWithoutServiceLinks } from '../../k8s/statefulSetWithoutServiceLinks';

export abstract class DatabaseChart extends Chart {
  public readonly service: Service;

  public constructor(
    scope: Construct,
    serviceName: string,
    imageName: string,
    envVariables: Record<string, EnvValue>,
    configuration: Configuration
  ) {
    super(scope, serviceName);

    const dataVolumeClaim = new PersistentVolumeClaim(this, 'data-claim', {
      metadata: { ...configuration.getMetadata(), name: serviceName },
      accessModes: [PersistentVolumeAccessMode.READ_WRITE_ONCE],
      storage: Size.gibibytes(8),
      storageClassName: configuration.storageClassName,
    });

    const dataVolume = Volume.fromPersistentVolumeClaim(
      this,
      'data',
      dataVolumeClaim
    );

    const statefulSet = new StatefulSetWithoutServiceLinks(this, 'sts', {
      metadata: { ...configuration.getMetadata(), name: serviceName },
      podMetadata: configuration.getMetadata(),
      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: serviceName },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      containers: [
        {
          image: configuration.getImage(imageName),

          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,

          envVariables: envVariables,

          ports: [
            {
              number: 5432,
              name: 'postgres',
            },
          ],

          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            ensureNonRoot: false,
            // the image is creating and writing to /config which prevents read only root
            readOnlyRootFilesystem: false,
          },

          resources: {
            cpu: {
              limit: Cpu.units(8),
              request: Cpu.units(1),
            },
            memory: {
              limit: Size.gibibytes(8),
              request: Size.gibibytes(0.5),
            },
          },

          volumeMounts: [
            {
              path: '/var/lib/postgresql/data/',
              volume: dataVolume,
              subPath: 'data',
            },
          ],
        },
      ],
      service: new Service(this, 'service', {
        metadata: {
          ...configuration.getMetadata(),
          name: serviceName,
        },
        ports: [
          {
            name: 'postgres',
            port: 5432,
          },
        ],
      }),
    });

    this.service = statefulSet.service;
  }
}
