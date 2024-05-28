/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { JsonPatch } from 'cdk8s';
import { StatefulSet, StatefulSetProps } from 'cdk8s-plus-25';
import { Construct } from 'constructs';

export class StatefulSetWithoutServiceLinks extends StatefulSet {
  public constructor(scope: Construct, id: string, props: StatefulSetProps) {
    super(scope, id, props);

    this.apiObject.addJsonPatch(
      JsonPatch.add('/spec/template/spec/enableServiceLinks', false)
    );
  }
}
