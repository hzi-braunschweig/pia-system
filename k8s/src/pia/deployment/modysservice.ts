/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { PersonaldataService } from './personaldataservice';
import { UserService } from './userservice';

export class ModysService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      userService,
      personalDataService,
    }: {
      userService: UserService;
      personalDataService: PersonaldataService;
    }
  ) {
    super(scope, configuration, 'modysservice', {
      MODYS_BASE_URL: configuration.variables.modys.baseUrl,
      MODYS_USERNAME: configuration.variables.modys.userName,
      MODYS_PASSWORD: configuration.variables.modys.password,
      MODYS_STUDY: configuration.variables.modys.study,
      MODYS_IDENTIFIER_TYPE_ID: configuration.variables.modys.identifierTypeId,
      MODYS_REQUEST_CONCURRENCY:
        configuration.variables.modys.requestConcurrency,

      USERSERVICE_HOST: userService.internalService.name,
      USERSERVICE_INTERNAL_PORT: userService.internalService.port,
      PERSONALDATASERVICE_HOST: personalDataService.internalService.name,
      PERSONALDATASERVICE_INTERNAL_PORT:
        personalDataService.internalService.port,
    });
  }
}
