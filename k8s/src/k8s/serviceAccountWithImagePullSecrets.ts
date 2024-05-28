/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { JsonPatch } from 'cdk8s';
import { ISecret, ServiceAccount, ServiceAccountProps } from 'cdk8s-plus-25';
import { Construct } from 'constructs';

export type ServiceAccountWithImagePullSecretsProps = ServiceAccountProps & {
  imagePullSecrets: ISecret[];
};

export class ServiceAccountWithImagePullSecrets extends ServiceAccount {
  public constructor(
    scope: Construct,
    id: string,
    props: ServiceAccountWithImagePullSecretsProps
  ) {
    super(scope, id, props);

    this.apiObject.addJsonPatch(
      JsonPatch.add(
        '/imagePullSecrets',
        props.imagePullSecrets.map((imagePullSecret) => {
          return {
            name: imagePullSecret.name,
          };
        })
      )
    );
  }
}
