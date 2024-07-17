/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import assert from 'assert';
import { Construct } from 'constructs';
import { Chart } from 'cdk8s';
import { Configuration } from './configuration';
import { EventHistoryServer } from './pia/deployment/eventhistoryserver';
import { PublicApiServer } from './pia/deployment/publicapiserver';
import { QPiaService } from './pia/stateful/qpiaservice';
import { EwPiaService } from './pia/stateful/ewpiaservice';
import { IPiaService } from './pia/stateful/ipiaservice';
import { MessageQueue } from './pia/stateful/messagequeue';
import { Authserver } from './pia/deployment/authserver';
import { ApiGateway } from './pia/deployment/apigateway';
import { WebappServer } from './pia/deployment/webappserver';
import { UserService } from './pia/deployment/userservice';
import { LoggingService } from './pia/deployment/loggingservice';
import { PersonaldataService } from './pia/deployment/personaldataservice';
import { ModysService } from './pia/deployment/modysservice';
import { ComplianceService } from './pia/deployment/complianceservice';
import { QuestionnaireService } from './pia/deployment/questionnaireservice';
import { AuthEventProxy } from './pia/deployment/autheventproxy';
import { AnalyzerService } from './pia/deployment/analyzerservice';
import { NotificationService } from './pia/deployment/notificationservice';
import { SampleTrackingService } from './pia/deployment/sampletrackingservice';
import { FeedbackStatisticService } from './pia/deployment/feedbackstatisticservice';
import { SormasService } from './pia/deployment/sormasservice';
import { IService } from './k8s/service';
import { MailServer } from './pia/deployment/mailserver';
import { Precheck } from './pia/precheck';
import { PiaNamespace } from './pia/deployment/namespace';

export class MainChart extends Chart {
  public allCharts: Chart[];

  public constructor(scope: Construct) {
    super(scope, 'pia');

    const config = new Configuration(this, 'config');
    const namespace = new PiaNamespace(this, config);

    const precheck = new Precheck(this, config);

    const qpiaService = new QPiaService(this, config);
    const ewpiaService = new EwPiaService(this, config);
    const ipiaService = new IPiaService(this, config);

    const messageQueue = new MessageQueue(this, config);
    const authServer = new Authserver(this, config, {
      ipiaService: ipiaService,
      messageQueue: messageQueue,
    });

    const webappServer = new WebappServer(this, config);

    // there are cyclic dependencies between:
    // loggingservice -> userservice -> loggingservice
    // personaldataservice -> userservice -> personaldataservice
    const loggingServiceService: IService = {
      name: 'internal-loggingservice',
      port: 5000,
    };
    const personalDataServiceService: IService = {
      name: 'internal-personaldataservice',
      port: 5000,
    };

    const userService = new UserService(this, config, {
      messageQueue,
      qpiaService,
      authServer,
      loggingServiceService,
      personalDataServiceService,
    });

    const loggingService = new LoggingService(this, config, {
      qpiaService,
      authServer,
      userService,
    });
    const personalDataService = new PersonaldataService(this, config, {
      ipiaService,
      messageQueue,
      authServer,
      loggingService,
      userService,
    });

    assert.strictEqual(
      loggingServiceService.name,
      loggingService.internalService.name
    );
    assert.strictEqual(
      loggingServiceService.port,
      loggingService.internalService.port
    );
    assert.strictEqual(
      personalDataServiceService.name,
      personalDataService.internalService.name
    );
    assert.strictEqual(
      personalDataServiceService.port,
      personalDataService.internalService.port
    );

    const modysService = new ModysService(this, config, {
      userService,
      personalDataService,
    });

    const complianceService = new ComplianceService(this, config, {
      userService,
      ewpiaService,
      messageQueue,
      authServer,
    });

    const sampleTrackingService = new SampleTrackingService(this, config, {
      userService,
      qpiaService,
      complianceService,
      messageQueue,
      authServer,
    });

    const publicApiServer = new PublicApiServer(this, config, { authServer });

    const eventHistoryServer = new EventHistoryServer(this, config, {
      authServer,
      qpiaService,
      messageQueue,
    });

    const questionnaireService = new QuestionnaireService(this, config, {
      userService,
      qpiaService,
      complianceService,
      sampleTrackingService,
      loggingService,
      messageQueue,
      authServer,
    });

    const analyzerService = new AnalyzerService(this, config, {
      qpiaService,
      messageQueue,
    });

    const notificationService = new NotificationService(this, config, {
      userService,
      qpiaService,
      messageQueue,
      authServer,
      personalDataService,
      questionnaireService,
    });

    const feedbackStatisticService = new FeedbackStatisticService(
      this,
      config,
      {
        userService,
        qpiaService,
        messageQueue,
        authServer,
        questionnaireService,
      }
    );
    const sormasService = new SormasService(this, config, {
      userService,
      qpiaService,
      messageQueue,
      authServer,
      personalDataService,
      questionnaireService,
    });

    const apigateway = new ApiGateway(this, config, {
      webappServer,
      authServer,
      userService,
      loggingService,
      personalDataService,
      modysService,
      complianceService,
      questionnaireService,
      analyzerService,
      notificationService,
      sampleTrackingService,
      feedbackStatisticService,
      sormasService,
      publicApiServer,
      eventHistoryServer,
    });

    const autheventproxy = new AuthEventProxy(this, config, {
      messageQueue,
      authServer,
    });

    const mailserver = new MailServer(this, config);

    this.allCharts = [
      namespace,
      precheck,
      qpiaService,
      ewpiaService,
      ipiaService,
      messageQueue,
      authServer,
      webappServer,
      userService,
      loggingService,
      personalDataService,
      modysService,
      complianceService,
      questionnaireService,
      analyzerService,
      notificationService,
      sampleTrackingService,
      feedbackStatisticService,
      sormasService,
      publicApiServer,
      eventHistoryServer,
      apigateway,
      autheventproxy,
      mailserver,
    ];
  }
}
