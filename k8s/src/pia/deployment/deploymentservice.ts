/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { QPiaService } from '../stateful/qpiaservice';
import { IPiaService } from '../stateful/ipiaservice';

export class DeploymentService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      qpiaService,
      ipiaService,
    }: {
      qpiaService: QPiaService;
      ipiaService: IPiaService;
    }
  ) {
    super(
      scope,
      configuration,
      'deploymentservice',
      {
        QPIA_HOST: qpiaService.service.name,
        QPIA_PORT: qpiaService.service.port,
        QPIA_USER: configuration.variables.qpia.user,
        QPIA_PASSWORD: configuration.variables.qpia.password,
        QPIA_DB: configuration.variables.qpia.db,

        IPIA_HOST: ipiaService.service.name,
        IPIA_PORT: ipiaService.service.port,
        IPIA_USER: configuration.variables.ipia.user,
        IPIA_PASSWORD: configuration.variables.ipia.password,
        IPIA_DB: configuration.variables.ipia.db,

        ENABLE_DB_IMPORT: false,
        ENABLE_DB_EXPORT: false,
        DEPLOYMENT_USER: 'deployer',
        DEPLOYMENT_PASSWORD: 'deployer',
        IS_DEVELOPMENT_SYSTEM: true,
      },
      {
        image: 'psa.utils.deploymentservice',
        noProbes: true,
      }
    );
  }
}
