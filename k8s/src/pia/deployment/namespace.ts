/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Chart } from 'cdk8s';
import { Namespace } from 'cdk8s-plus-25';
import { Configuration } from '../../configuration';

export class PiaNamespace extends Chart {
  public readonly piaNamespace: Namespace;

  public constructor(scope: Construct, config: Configuration) {
    super(scope, 'namespace');

    this.piaNamespace = new Namespace(this, 'pia-namespace', {
      metadata: {
        ...config.getMetadata(),
        name: 'pia',
        annotations: {
          'linkerd.io/inject': 'enabled',
        },
      },
    });
  }
}
