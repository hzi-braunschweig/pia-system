/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import {
  AuthHeader,
  AuthServerMock,
  AuthTokenMockBuilder,
  RealmRole,
} from '@pia/lib-service-core';
import { config } from '../../src/config';
import { HttpClient } from '@pia-system/lib-http-clients-internal';

import fetchMocker from 'fetch-mock';
import { createSandbox } from 'sinon';
import chaiHttp from 'chai-http';
import { MarkOptional } from 'ts-essentials';
import { FeedbackStatisticConfigurationDto } from '../../src/model/feedbackStatisticConfiguration';
import { TimeSpanUnit } from '../../src/model/timeSpan';
import { MessageQueueClient, MessageQueueTopic } from '@pia/lib-messagequeue';

import * as util from 'util';
import { FeedbackStatisticVisibility } from '../../src/entities/feedbackStatisticConfiguration';

const sleep = util.promisify(setTimeout);

chai.use(chaiHttp);

type Topics =
  | MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED
  | MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED;

/* eslint-disable @typescript-eslint/no-magic-numbers */
class TestHelper {
  private readonly testSandbox = createSandbox();

  private readonly apiAddress = `http://127.0.0.1:${config.public.port}`;

  private readonly fetchMock = fetchMocker.sandbox();

  private study = 'QTestStudy1';

  private readonly username: string = 'qtest-proband1';

  private role: RealmRole = 'Forscher';

  private allowedStudy: string | undefined;

  private readonly chain: (() => Promise<void>)[] = [];

  private readonly finallyChain: (() => Promise<void>)[] = [];

  private readonly messages: Topics[] = [];

  private id = -1;

  private response: {
    body: unknown;
    status: number;
    text: string;
  } = {
    body: undefined,
    status: 0,
    text: '',
  };

  private configuration: MarkOptional<
    Omit<FeedbackStatisticConfigurationDto, 'updatedAt' | 'createdAt'>,
    'id'
  > = {
    study: this.study,
    visibility: FeedbackStatisticVisibility.ALLAUDIENCES,
    title: 'title',
    description: 'description',
    type: 'relative_frequency_time_series',
    comparativeValues: {
      questionnaire: {
        id: 567,
        version: 1567,
      },
      answerOptionValueCodes: {
        id: 345,
        variableName: 'some-variable-name',
        valueCodes: [9, 234, 12378, 14234],
      },
    },
    timeSeries: [
      {
        id: 1,
        color: '#123445',
        label: 'another-label',
        questionnaire: {
          id: 9345,
          version: 2344,
        },
        answerOptionValueCodes: {
          id: 234324234,
          variableName: 'some-other-name',
          valueCodes: [2345345, 145534, 3421],
        },
      },
    ],
    intervalShift: {
      amount: 123,
      unit: TimeSpanUnit.DAY,
    },
    timeRange: {
      endDate: new Date(1675755694).toISOString(),
      startDate: new Date(1675755695).toISOString(),
    },
  };

  public constructor() {
    this.mockHttpClient();

    this.addFinalizer(async () => {
      AuthServerMock.cleanAll();
      return Promise.resolve();
    });
  }

  public withId(id: number): this {
    this.addAction(async () => {
      this.id = id;

      this.configuration = {
        ...this.configuration,
        id,
      };
      return Promise.resolve();
    });

    return this;
  }

  public withIdsFromResponse(): this {
    this.addAction(async () => {
      const body: FeedbackStatisticConfigurationDto = this.response
        .body as FeedbackStatisticConfigurationDto;
      this.id = body.id;

      this.configuration = {
        ...this.configuration,
        id: body.id,
        timeSeries: this.configuration.timeSeries.map(
          (timeSeries, index: number) => ({
            ...timeSeries,
            // eslint-disable-next-line security/detect-object-injection
            id: body.timeSeries[index]?.id,
          })
        ),
      };
      return Promise.resolve();
    });
    return this;
  }

  public withTestUserProbandFromUserservice(): this {
    this.addAction(async () => {
      this.fetchMock.get(
        { url: `express:/user/users/${this.username}` },
        { isTestUser: true }
      );
      return Promise.resolve();
    });
    return this;
  }

  public withQuestionnaire(): this {
    this.addAction(async () => {
      this.fetchMock.get({ url: `express:/questionnaire/567/1567` }, {});
      return Promise.resolve();
    });
    return this;
  }

  public withNonTestUserProbandFromUserservice(): this {
    this.addAction(async () => {
      this.fetchMock.get(
        { url: `express:/user/users/${this.username}` },
        { isTestUser: false }
      );
      return Promise.resolve();
    });
    return this;
  }

  public withProbandRole(): this {
    this.addAction(async () => {
      this.role = 'Proband';
      return Promise.resolve();
    });
    return this;
  }

  public withForscherRole(): this {
    this.addAction(async () => {
      this.role = 'Forscher';
      return Promise.resolve();
    });
    return this;
  }

  public withAllowedStudy(study: string): this {
    this.addAction(async () => {
      this.allowedStudy = study;
      return Promise.resolve();
    });
    return this;
  }

  public withStudy(study: string): this {
    this.addAction(async () => {
      this.study = study;
      this.configuration.study = study;
      return Promise.resolve();
    });
    return this;
  }

  public withConfigurationUpdate(
    update: Partial<FeedbackStatisticConfigurationDto>
  ): this {
    this.addAction(async () => {
      this.configuration = {
        ...this.configuration,
        ...update,
      };
      return Promise.resolve();
    });
    return this;
  }

  public sendMessage(
    topic:
      | MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED
      | MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED
  ): this {
    this.addAction(async () => {
      const mqc = new MessageQueueClient(config.servers.messageQueue);
      await mqc.connect();

      try {
        const producer = await mqc.createProducer<void>(topic);
        await producer.publish();
      } finally {
        await mqc.disconnect();
      }

      return Promise.resolve();
    });

    return this;
  }

  public withMessageQueueConsumer(): this {
    this.addAction(async () => {
      const mqc = new MessageQueueClient({
        ...config.servers.messageQueue,
        serviceName: 'TEST',
      });
      this.addFinalizer(async () => {
        await mqc.disconnect();
      });

      await mqc.connect();
      await mqc.createConsumer(
        MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED,
        async () => {
          this.messages.push(
            MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED
          );
          return Promise.resolve();
        }
      );
      await mqc.createConsumer(
        MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED,
        async () => {
          this.messages.push(MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED);
          return Promise.resolve();
        }
      );

      return Promise.resolve();
    });

    return this;
  }

  public createConfiguration(): this {
    this.addAction(async () => {
      AuthServerMock.adminRealm().returnValid();
      this.response = await chai
        .request(this.apiAddress)
        .post(`/admin/studies/${this.study}/configuration`)
        .set(this.buildHeader())
        .send(this.configuration);
      return Promise.resolve();
    });

    return this;
  }

  public updateConfiguration(): this {
    this.addAction(async () => {
      AuthServerMock.adminRealm().returnValid();
      this.response = await chai
        .request(this.apiAddress)
        .put(`/admin/studies/${this.study}/configuration/${this.id}`)
        .set(this.buildHeader())
        .send(this.configuration);
      return Promise.resolve();
    });

    return this;
  }

  public getConfiguration(): this {
    this.addAction(async () => {
      AuthServerMock.adminRealm().returnValid();
      this.response = await chai
        .request(this.apiAddress)
        .get(`/admin/studies/${this.study}/configuration/${this.id}`)
        .set(this.buildHeader());
      return Promise.resolve();
    });
    return this;
  }

  public deleteConfiguration(): this {
    this.addAction(async () => {
      AuthServerMock.adminRealm().returnValid();
      this.response = await chai
        .request(this.apiAddress)
        .delete(`/admin/studies/${this.study}/configuration/${this.id}`)
        .set(this.buildHeader());
      return Promise.resolve();
    });
    return this;
  }

  public getPublicStatistics(): this {
    this.addAction(async () => {
      AuthServerMock.probandRealm().returnValid();
      this.response = await chai
        .request(this.apiAddress)
        .get(`/`)
        .set(this.buildHeader());
      return Promise.resolve();
    });
    return this;
  }

  public getAdminStatistics(): this {
    this.addAction(async () => {
      AuthServerMock.adminRealm().returnValid();
      this.response = await chai
        .request(this.apiAddress)
        .get(`/admin/studies/${this.study}`)
        .set(this.buildHeader());
      return Promise.resolve();
    });
    return this;
  }

  public expectResponseStatus(status: StatusCodes): this {
    this.addAction(async () => {
      expect(this.response, this.response.text).to.have.status(status);
      return Promise.resolve();
    });
    return this;
  }

  public expectResponseConfiguration(): this {
    this.addAction(async () => {
      const configuration = this.response.body as {
        updatedAt: unknown;
        createdAt: unknown;
      };

      delete configuration.updatedAt;
      delete configuration.createdAt;

      expect(this.response.body).to.deep.equal(this.configuration);
      return Promise.resolve();
    });
    return this;
  }

  public expectMessages(...topics: Topics[]): this {
    this.addAction(async () => {
      const start = Date.now();
      while (
        Date.now() - start < 1000 &&
        this.messages.length !== topics.length
      ) {
        await sleep(1);
      }

      expect(this.messages).to.deep.equal(topics);
      return Promise.resolve();
    });
    return this;
  }

  public async exec(): Promise<void> {
    try {
      for (const action of this.chain) {
        await action();
      }
    } finally {
      for (const finalizer of this.finallyChain) {
        await finalizer();
      }
    }
  }

  public build(): () => Promise<void> {
    return async () => {
      await this.exec();
    };
  }

  private addAction(action: () => Promise<void>): this {
    this.chain.push(action);
    return this;
  }

  private addFinalizer(finalizer: () => Promise<void>): this {
    this.finallyChain.push(finalizer);
    return this;
  }

  private buildHeader(): AuthHeader {
    return AuthTokenMockBuilder.createAuthHeader({
      roles: [this.role],
      username: this.username,
      studies: [this.allowedStudy ?? this.study],
    });
  }

  private mockHttpClient(): void {
    this.addAction(async () => {
      this.fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.testSandbox.stub(HttpClient, 'fetch').callsFake(this.fetchMock);
      return Promise.resolve();
    });

    this.addFinalizer(async () => {
      this.testSandbox.restore();
      return Promise.resolve();
    });
  }
}

export function given(): TestHelper {
  return new TestHelper();
}
