/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { dataSource } from '../../src/db';
import { Configuration } from '../../src/entity/configuration';
import { EventHistoryServer } from '../../src/server';
import { Event } from '../../src/entity/event';
import { MessageQueueTopic } from '@pia/lib-messagequeue';

chai.use(chaiHttp);

describe('/event-history', () => {
  const apiAddress = `http://localhost:${config.public.port}`;
  const sandbox = sinon.createSandbox();
  const server = new EventHistoryServer();
  const clientAuthHeader = AuthTokenMockBuilder.createAuthHeader({
    roles: [],
    username: '',
    studies: ['Study A', 'Study B', 'Study C'],
  });

  before(async function () {
    await server.init();
  });

  after(async function () {
    sandbox.restore();

    await server.stop();
  });

  beforeEach(async () => {
    AuthServerMock.adminRealm().returnValid();
    await dataSource.getRepository(Configuration).save([
      { id: 'retentionTimeInDays', value: 30 },
      { id: 'active', value: true },
    ]);
  });

  afterEach(async () => {
    AuthServerMock.cleanAll();
    // reset configuration to migration default values
    await dataSource.getRepository(Event).delete({});
  });

  describe('GET /public/event-history', () => {
    context('HTTP 200', () => {
      it('should return all events the current client has access to', async () => {
        const studiesWithEvents = await setupEventsForStudies();

        const result = await chai
          .request(apiAddress)
          .get('/public/event-history')
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal(
          emulateJsonResponse(
            sortEventsByTimestamp([
              ...studiesWithEvents.A,
              ...studiesWithEvents.B,
              ...studiesWithEvents.C,
            ])
          )
        );
      });

      it('should return all events filtered by `studyName`', async () => {
        const studiesWithEvents = await setupEventsForStudies();

        const result = await chai
          .request(apiAddress)
          .get('/public/event-history?studyName=Study A')
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal(
          emulateJsonResponse(sortEventsByTimestamp([...studiesWithEvents.A]))
        );
      });

      it('should return all events filtered by `from` and `to`', async () => {
        const studiesWithEvents = await setupEventsForStudies();
        const from = getTimeStamp('01:00:00');
        const to = getTimeStamp('03:00:00');

        const result = await chai
          .request(apiAddress)
          .get(`/public/event-history?from=${from}&to=${to}`)
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal(
          emulateJsonResponse(
            sortEventsByTimestamp([
              studiesWithEvents.A[1] as unknown as Event,
              ...studiesWithEvents.B,
              studiesWithEvents.C[0] as unknown as Event,
            ])
          )
        );
      });

      it('should return all events filtered by `from`', async () => {
        const studiesWithEvents = await setupEventsForStudies();
        const from = getTimeStamp('02:00:00');

        const result = await chai
          .request(apiAddress)
          .get(`/public/event-history?from=${from}`)
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal(
          emulateJsonResponse(
            sortEventsByTimestamp([
              ...studiesWithEvents.B,
              ...studiesWithEvents.C,
            ])
          )
        );
      });

      it('should return all events filtered by `to`', async () => {
        const studiesWithEvents = await setupEventsForStudies();
        const to = getTimeStamp('03:00:00');

        const result = await chai
          .request(apiAddress)
          .get(`/public/event-history?to=${to}`)
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal(
          emulateJsonResponse(
            sortEventsByTimestamp([
              ...studiesWithEvents.A,
              ...studiesWithEvents.B,
              studiesWithEvents.C[0] as unknown as Event,
            ])
          )
        );
      });

      it('should return all events filtered by `type`', async () => {
        const studiesWithEvents = await setupEventsForStudies();

        const result = await chai
          .request(apiAddress)
          .get(
            `/public/event-history?type=${MessageQueueTopic.PROBAND_EMAIL_VERIFIED}`
          )
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal(
          emulateJsonResponse(
            sortEventsByTimestamp([
              studiesWithEvents.A[1] as unknown as Event,
              studiesWithEvents.C[1] as unknown as Event,
            ])
          )
        );
      });

      it('should return an empty array when no events are available', async () => {
        const result = await chai
          .request(apiAddress)
          .get('/public/event-history')
          .set(clientAuthHeader);

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal([]);
      });

      it('should return an empty array when client has no studies assigned', async () => {
        const result = await chai
          .request(apiAddress)
          .get('/public/event-history')
          .set(
            AuthTokenMockBuilder.createAuthHeader({
              username: 'admin',
              roles: [],
              studies: [],
            })
          );

        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body).to.deep.equal([]);
      });
    });

    it('should return HTTP 401 when the client is not authenticated', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/public/event-history');

      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 the client has not access to the requested studyName', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/public/event-history?studyName=Study X')
        .set(clientAuthHeader);

      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when event history is disabled', async () => {
      await dataSource.getRepository(Configuration).save([
        { id: 'retentionTimeInDays', value: null },
        { id: 'active', value: false },
      ]);

      const result = await chai
        .request(apiAddress)
        .get('/public/event-history')
        .set(clientAuthHeader);

      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
});

function emulateJsonResponse(response: unknown): unknown {
  return JSON.parse(JSON.stringify(response));
}

function getTimeStamp(timeString = '00:00:00'): string {
  const today = new Date();
  const todayString = `${today.getUTCFullYear()}-${`0${
    today.getUTCMonth() + 1
  }`.slice(-2)}-${`0${today.getUTCDate()}`.slice(-2)}`;
  return todayString + 'T' + timeString + '.000Z';
}

type StudiesWithEvents = Record<'A' | 'B' | 'C' | 'X', Event[]>;

function sortEventsByTimestamp(events: Event[]): Event[] {
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

async function setupEventsForStudies(): Promise<StudiesWithEvents> {
  const studies: StudiesWithEvents = {
    A: [
      {
        id: 100,
        studyName: 'Study A',
        timestamp: new Date(getTimeStamp('00:00:00')),
        type: MessageQueueTopic.PROBAND_CREATED,
        payload: {
          pseudonym: 'stdya-000000001',
        },
      },
      {
        id: 110,
        studyName: 'Study A',
        timestamp: new Date(getTimeStamp('01:00:00')),
        type: MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
        payload: {
          pseudonym: 'stdya-000000001',
        },
      },
    ],
    B: [
      {
        id: 200,
        studyName: 'Study B',
        timestamp: new Date(getTimeStamp('02:00:00')),
        type: MessageQueueTopic.PROBAND_CREATED,
        payload: {
          pseudonym: 'stdyb-000000001',
        },
      },
    ],
    C: [
      {
        id: 300,
        studyName: 'Study C',
        timestamp: new Date(getTimeStamp('03:00:00')),
        type: MessageQueueTopic.PROBAND_CREATED,
        payload: {
          pseudonym: 'stdyc-000000001',
        },
      },
      {
        id: 310,
        studyName: 'Study C',
        timestamp: new Date(getTimeStamp('04:00:00')),
        type: MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
        payload: {
          pseudonym: 'stdyc-000000001',
        },
      },
    ],
    X: [
      // Event timestamps in this study match with events from other studies to
      // ensure filtering by `from` and `to` does not disable filtering by `studyName`
      {
        id: 400,
        studyName: 'Study X',
        timestamp: new Date(getTimeStamp('01:00:00')),
        type: MessageQueueTopic.PROBAND_CREATED,
        payload: {
          pseudonym: 'stdyx-000000001',
        },
      },
      {
        id: 410,
        studyName: 'Study X',
        timestamp: new Date(getTimeStamp('02:00:00')),
        type: MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
        payload: {
          pseudonym: 'stdyx-000000001',
        },
      },
      {
        id: 420,
        studyName: 'Study X',
        timestamp: new Date(getTimeStamp('03:00:00')),
        type: MessageQueueTopic.PROBAND_CREATED,
        payload: {
          pseudonym: 'stdyx-000000002',
        },
      },
    ],
  };

  await dataSource
    .getRepository(Event)
    .save([...studies.A, ...studies.B, ...studies.C, ...studies.X]);

  return studies;
}
