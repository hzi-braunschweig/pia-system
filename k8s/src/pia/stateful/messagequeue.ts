/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart, Size } from 'cdk8s';
import {
  Cpu,
  ImagePullPolicy,
  PersistentVolumeAccessMode,
  PersistentVolumeClaim,
  Service,
  Volume,
} from 'cdk8s-plus-25';
import { Configuration } from '../../configuration';
import { Construct } from 'constructs';
import { ServiceAccountWithImagePullSecrets } from '../../k8s/serviceAccountWithImagePullSecrets';
import { StatefulSetWithoutServiceLinks } from '../../k8s/statefulSetWithoutServiceLinks';

export class MessageQueue extends Chart {
  public readonly service: Service;

  public constructor(scope: Construct, configuration: Configuration) {
    super(scope, 'messagequeue');

    const dataVolumeClaim = new PersistentVolumeClaim(this, 'data-claim', {
      metadata: { ...configuration.getMetadata(), name: 'messagequeue' },
      accessModes: [PersistentVolumeAccessMode.READ_WRITE_ONCE],
      storage: Size.gibibytes(1),
      storageClassName: configuration.storageClassName,
    });

    const dataVolume = Volume.fromPersistentVolumeClaim(
      this,
      'data',
      dataVolumeClaim
    );

    const statefulSet = new StatefulSetWithoutServiceLinks(this, 'sts', {
      metadata: { ...configuration.getMetadata(), name: 'messagequeue' },
      podMetadata: configuration.getMetadata(),
      serviceAccount: new ServiceAccountWithImagePullSecrets(this, 'sa', {
        metadata: { ...configuration.getMetadata(), name: 'messagequeue' },
        imagePullSecrets: [configuration.dockerConfigSecret],
        automountToken: false,
      }),

      hostAliases: [
        {
          hostnames: ['messagequeue'],
          ip: '127.0.0.1',
        },
      ],
      containers: [
        {
          image: configuration.getImage('psa.server.messagequeue'),
          name: 'messagequeue',
          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,

          envVariables: configuration.getVariables({
            MESSAGEQUEUE_ADMIN_PASSWORD:
              configuration.variables.messageQueue.adminPassword,
            MESSAGEQUEUE_APP_PASSWORD:
              configuration.variables.messageQueue.appPassword,
            RABBITMQ_NODENAME: 'rabbit@messagequeue',
          }),

          ports: [
            {
              number: 5672,
              name: 'rabbitmq',
            },
          ],

          securityContext: {
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },

          resources: {
            cpu: {
              limit: Cpu.units(2),
              request: Cpu.units(1),
            },
            memory: {
              limit: Size.gibibytes(2),
              request: Size.gibibytes(0.5),
            },
          },

          volumeMounts: [
            {
              path: '/var/lib/rabbitmq/mnesia/',
              volume: dataVolume,
            },
          ],
        },
      ],
      service: new Service(this, 'service', {
        metadata: { ...configuration.getMetadata(), name: 'messagequeue' },
        ports: [
          {
            port: 5672,
          },
        ],
      }),
    });

    this.service = statefulSet.service;
  }
}
