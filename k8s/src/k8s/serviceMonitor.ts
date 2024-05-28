/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ApiObject, ApiObjectMetadata } from 'cdk8s';
import { Construct } from 'constructs';

export interface ServiceMonitorSpecEndpoints {
  readonly path?: string;
  readonly port?: string;
  readonly scheme?: 'http' | 'https';
  readonly tlsConfig?: {
    insecureSkipVerify: boolean;
  };
}

export interface ServiceMonitorSpecSelector {
  readonly matchLabels?: Record<string, string>;
}

export interface ServiceMonitorSpec {
  readonly endpoints?: ServiceMonitorSpecEndpoints[];
  readonly selector: ServiceMonitorSpecSelector;
}

export interface ServiceMonitorConfig {
  readonly metadata?: ApiObjectMetadata;
  readonly spec: ServiceMonitorSpec;
}

export class ServiceMonitor extends ApiObject {
  public constructor(
    scope: Construct,
    id: string,
    config: ServiceMonitorConfig
  ) {
    super(scope, id, {
      apiVersion: 'monitoring.coreos.com/v1',
      kind: 'ServiceMonitor',
      ...config,
    });
  }
}
