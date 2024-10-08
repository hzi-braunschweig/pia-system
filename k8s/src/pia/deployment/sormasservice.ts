/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { UserService } from './userservice';
import { QPiaService } from '../stateful/qpiaservice';
import { MessageQueue } from '../stateful/messagequeue';
import { Authserver } from './authserver';
import { PersonaldataService } from './personaldataservice';
import { QuestionnaireService } from './questionnaireservice';

export class SormasService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      userService,
      qpiaService,
      messageQueue,
      authServer,
      personalDataService,
      questionnaireService,
    }: {
      userService: UserService;
      qpiaService: QPiaService;
      messageQueue: MessageQueue;
      authServer: Authserver;
      personalDataService: PersonaldataService;
      questionnaireService: QuestionnaireService;
    }
  ) {
    super(
      scope,
      configuration,
      'sormasservice',
      {
        USERSERVICE_HOST: userService.internalService.name,
        USERSERVICE_INTERNAL_PORT: userService.internalService.port,

        PERSONALDATASERVICE_HOST: personalDataService.internalService.name,
        PERSONALDATASERVICE_INTERNAL_PORT:
          personalDataService.internalService.port,

        QUESTIONNAIRESERVICE_HOST: questionnaireService.internalService.name,
        QUESTIONNAIRESERVICE_INTERNAL_PORT:
          questionnaireService.internalService.port,

        WEBAPP_URL: configuration.variables.webappUrl,
        DEFAULT_LANGUAGE: configuration.variables.defaultLanguage,

        QPIA_HOST: qpiaService.service.name,
        QPIA_PORT: qpiaService.service.port,
        QPIA_USER: configuration.variables.qpia.user,
        QPIA_PASSWORD: configuration.variables.qpia.password,
        QPIA_DB: configuration.variables.qpia.db,

        DB_SORMAS_HOST: qpiaService.service.name,
        DB_SORMAS_PORT: qpiaService.service.port,
        DB_SORMAS_USER: configuration.variables.sormasUser,
        DB_SORMAS_PASSWORD: configuration.variables.sormasPassword,
        DB_SORMAS_DB: configuration.variables.qpia.db,

        MAIL_HOST: configuration.variables.mail.host,
        MAIL_PORT: configuration.variables.mail.port,
        MAIL_USER: configuration.variables.mail.user,
        MAIL_PASSWORD: configuration.variables.mail.password,
        MAIL_REQUIRE_TLS: configuration.variables.mail.requireTls,
        MAIL_FROM_ADDRESS: configuration.variables.mail.fromAddress,
        MAIL_FROM_NAME: configuration.variables.mail.fromName,

        VERBOSE: false,

        SORMAS_STUDY: '',
        SORMAS_SERVER_URL: '',
        PIA_ON_SORMAS_USER: '',
        PIA_ON_SORMAS_PASSWORD: '',
        SORMAS_ON_PIA_USER: '',
        SORMAS_ON_PIA_PASSWORD: '',
        SORMAS_ON_PIA_TOKEN_VALIDITY_TIMEOUT: 300,

        MESSAGEQUEUE_HOST: messageQueue.service.name,
        MESSAGEQUEUE_PORT: messageQueue.service.port,
        MESSAGEQUEUE_APP_PASSWORD:
          configuration.variables.messageQueue.appPassword,
        MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,

        AUTHSERVER_PORT: authServer.service.port,
        AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET:
          configuration.variables.authserver
            .probandTokenIntrospectionClientSecret,
        AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
          configuration.variables.authserver
            .adminTokenIntrospectionClientSecret,
      },
      {
        // is currently not scalable because its using a scheduler
        replicas: 1,
      }
    );
  }
}
