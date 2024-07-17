/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonStubbedInstance } from 'sinon';
import sinonChai from 'sinon-chai';
import fetchMocker from 'fetch-mock';
import { Server } from '../../src/server';
import { messageQueueService } from '../../src/services/messageQueueService';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  MessageQueueTopic,
  Producer,
  ProbandRegisteredMessage,
  ProbandEmailVerifiedMessage,
} from '@pia/lib-messagequeue';
import { config } from '../../src/config';
import { mockGetProbandAccount } from './accountServiceRequestMock.helper.spec';
import {
  HttpClient,
  ProbandOrigin,
} from '@pia-system/lib-http-clients-internal';
import { MailService } from '@pia/lib-service-core';
import { SinonMethodStub } from '@pia/lib-service-core/src';
import { ProbandService } from '../../src/services/probandService';
import { ProbandDto } from '../../src/models/proband';
import { getRepository } from 'typeorm';
import { Proband } from '../../src/entities/proband';
import { cleanup, setup } from './messageQueueService.spec.data/setup.helper';
import { ProbandStatus } from '../../src/models/probandStatus';
import { probandAuthClient } from '../../src/clients/authServerClient';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';

chai.use(sinonChai);

describe('MessageQueueService', () => {
  const fetchMock = fetchMocker.sandbox();
  const testSandbox = sinon.createSandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  let sendMailStub: SinonMethodStub<typeof MailService.sendMail>;

  before(async () => {
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);

    sendMailStub = testSandbox.stub(MailService, 'sendMail').resolves(true);

    await setup();
    await Server.init();
    await mqc.connect(true);
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
    await cleanup();
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('Consume proband.email_verified', () => {
    const topic = MessageQueueTopic.PROBAND_EMAIL_VERIFIED;
    let producer: Producer<ProbandEmailVerifiedMessage>;
    let processedProbandEmailVerified: Promise<{
      message: ProbandEmailVerifiedMessage;
      timestamp: number;
    }>;

    beforeEach(async () => {
      mockGetProbandAccount(testSandbox, 'qtest-proband1', 'Teststudy');
      fetchMock.put('express:/personal/personalData/proband/:pseudonym', {});

      producer = await mqc.createProducer(topic);
      processedProbandEmailVerified =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          topic,
          testSandbox
        );
    });

    it('should save the account email address in personaldataservice and send a welcome mail', async () => {
      // Arrange
      testSandbox
        .stub(ProbandService, 'getProbandByPseudonymOrFail')
        .resolves({ study: 'Teststudy' } as ProbandDto);

      // Act
      await producer.publish({
        pseudonym: 'qtest-proband1',
        studyName: 'Teststudy',
      });
      await processedProbandEmailVerified;

      // Assert
      expect(
        fetchMock.called('express:/personal/personalData/proband/:pseudonym', {
          method: 'PUT',
          params: {
            pseudonym: 'qtest-proband1',
          },
          query: {
            skipUpdateAccount: 'true',
          },
          body: {
            email: 'testproband@example.com',
          },
        })
      ).to.be.true;
      expect(sendMailStub).to.have.been.calledWith('testproband@example.com', {
        subject: 'Willkommen bei PIA',
        html:
          '<p>Vielen Dank, dass Sie zur Teilnahme an unserer Studie und der Verwendung von PIA bereit sind!</p>\n' +
          '<p><strong>Verwendung der mobilen App PIA mit Smartphone oder Tablet</strong></p>\n' +
          '<p>Sie können PIA über die mobile App im Play Store (Android) oder App Store (iOS) herunterladen und nutzen: </p>\n' +
          '<p><a href="https://play.google.com/store/apps/details?id=de.pia.app">Google Play</a></p>\n' +
          '<p><a href="https://apps.apple.com/de/app/pia-epidemiologie/id1510929221">App Store</a></p>\n' +
          '<p><strong>Verwendung im Browser</strong></p>\n' +
          '<p>Sie können PIA auch im Browser nutzen. Nach Eingabe Ihrer Zugangsdaten können Sie sofort mit den ersten Fragebögen starten. </p>\n' +
          '<p>Ihr Benutzername ist <strong>qtest-proband1</strong></p>\n' +
          '<p>Sollten Sie Fragen oder Probleme beim Anmeldeprozess haben, melden Sie sich gerne bei Ihrem Studienteam.</p>\n',
      });
    });
  });

  describe('Consume proband.registered', () => {
    const expectedStudy = 'QTestStudy3';
    const expectedId = 'mock-id';
    const expectedPayload: ProbandRegisteredMessage = {
      username: 'some-fake-email@localhost',
      studyName: expectedStudy,
    };
    const topic = MessageQueueTopic.PROBAND_REGISTERED;
    let authClientUsersMock: SinonStubbedInstance<Users>;
    let producer: Producer<ProbandRegisteredMessage>;
    let processedProbandRegistered: Promise<{
      message: ProbandRegisteredMessage;
      timestamp: number;
    }>;

    beforeEach(async () => {
      producer = await mqc.createProducer(topic);
      processedProbandRegistered =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          topic,
          testSandbox
        );

      authClientUsersMock = testSandbox.stub(probandAuthClient.users);
      authClientUsersMock.find.resolves([
        {
          id: expectedId,
          username: expectedPayload.username,
        },
      ]);
      authClientUsersMock.update.resolves();
      authClientUsersMock.logout.resolves();

      authClientUsersMock.listGroups.resolves([{ name: expectedStudy }]);
    });

    it('should create a proband with a random pseudonym', async () => {
      await producer.publish(expectedPayload);

      await processedProbandRegistered;

      const result = await getRepository(Proband).find({
        relations: ['study'],
        loadRelationIds: true,
      });

      expect(result.length).to.eq(1);

      const proband: Proband = result[0] as unknown as Proband;

      expect(proband.pseudonym).to.match(/qtest3-\d{3}/);
      expect(proband.status).to.eq(ProbandStatus.ACTIVE);
      expect(proband.study).to.eq(expectedStudy);
      expect(proband.complianceContact).to.eq(true);
      expect(proband.complianceBloodsamples).to.eq(false);
      expect(proband.complianceLabresults).to.eq(false);
      expect(proband.complianceSamples).to.eq(false);
      expect(proband.studyCenter).to.eq(null);
      expect(proband.examinationWave).to.eq(null);
      expect(proband.ids).to.eq(null);
      expect(proband.origin).to.eq(ProbandOrigin.SELF);

      expect(authClientUsersMock.update).to.have.been.calledWith(
        { id: expectedId },
        {
          username: proband.pseudonym,
        }
      );

      expect(authClientUsersMock.logout).to.have.been.calledWith({
        id: expectedId,
      });
    });
  });
});
