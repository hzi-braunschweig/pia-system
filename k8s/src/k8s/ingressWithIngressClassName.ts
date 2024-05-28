/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { JsonPatch } from 'cdk8s';
import { Ingress, IngressProps } from 'cdk8s-plus-25';
import { Construct } from 'constructs';

export class IngressWithIngressClassName extends Ingress {
  public constructor(
    scope: Construct,
    id: string,
    props: IngressProps & { ingressClassName?: string }
  ) {
    super(scope, id, props);

    if (props.ingressClassName) {
      this.apiObject.addJsonPatch(
        JsonPatch.add('/spec/ingressClassName', props.ingressClassName)
      );
    }
  }
}
