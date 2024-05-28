/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { dataSource } from '../../src/db';
import { Configuration } from '../../src/entity/configuration';

import { EventHistoryServer } from '../../src/server';
import { Event } from '../../src/entity/event';
import { MessageQueueTopic } from '@pia/lib-messagequeue';

chai.use(chaiHttp);

describe('/config', function () {
  const apiAddress = `http://localhost:${config.public.port}`;
  const server = new EventHistoryServer();
  const sysadminAuthHeader = AuthTokenMockBuilder.createAuthHeader({
    username: 'admin',
    roles: ['SysAdmin'],
    studies: [],
  });
  const professionalAuthHeader = AuthTokenMockBuilder.createAuthHeader({
    username: 'researcher',
    roles: ['Forscher'],
    studies: ['Study A'],
  });

  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  beforeEach(() => {
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(async () => {
    AuthServerMock.cleanAll();
    // reset configuration to migration default values
    await dataSource.getRepository(Configuration).save([
      { id: 'retentionTimeInDays', value: null },
      { id: 'active', value: false },
    ]);
  });

  describe('GET /admin/config', () => {
    it('should return HTTP 200 and the current configuration', async () => {
      await dataSource.getRepository(Configuration).save([
        { id: 'retentionTimeInDays', value: 30 },
        { id: 'active', value: true },
      ]);

      const result = await chai
        .request(apiAddress)
        .get('/admin/config')
        .set(sysadminAuthHeader)
        .send();

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({
        retentionTimeInDays: 30,
        active: true,
      });
    });

    it('should return HTTP 200 default configuration', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/config')
        .set(sysadminAuthHeader)
        .send();

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({
        retentionTimeInDays: null,
        active: false,
      });
    });

    it('should return HTTP 401 if the user has no valid token', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/config')
        .set({ authorization: 'Bearer invalid' })
        .send();

      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if the user is not a SysAdmin', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/config')
        .set(professionalAuthHeader)
        .send();

      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('POST /admin/config', () => {
    it('should return HTTP 200 and save the new configuration', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/config')
        .set(sysadminAuthHeader)
        .send({
          retentionTimeInDays: 60,
          active: true,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({
        retentionTimeInDays: 60,
        active: true,
      });

      const configuration = await dataSource
        .getRepository(Configuration)
        .find();

      expect(configuration).to.deep.equal([
        { id: 'retentionTimeInDays', value: 60 },
        { id: 'active', value: true },
      ]);
    });

    it('should return HTTP 200 and save the new configuration if retentionTimeInDays is not null and active is false', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/config')
        .set(sysadminAuthHeader)
        .send({
          retentionTimeInDays: 60,
          active: false,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({
        retentionTimeInDays: 60,
        active: false,
      });
    });

    it('should return HTTP 200 and clear event history, when event history is disabled', async () => {
      await dataSource.getRepository(Configuration).save([
        { id: 'retentionTimeInDays', value: 30 },
        { id: 'active', value: true },
      ]);

      await dataSource.getRepository(Event).save([
        {
          studyName: 'Study A',
          type: MessageQueueTopic.PROBAND_CREATED,
          timestamp: new Date(),
          payload: { pseudonym: 'studyc-000000001' },
        },
        {
          studyName: 'Study A',
          type: MessageQueueTopic.PROBAND_CREATED,
          timestamp: new Date(),
          payload: { pseudonym: 'studyb-000000002' },
        },
        {
          studyName: 'Study A',
          type: MessageQueueTopic.PROBAND_CREATED,
          timestamp: new Date(),
          payload: { pseudonym: 'studya-000000003' },
        },
      ]);

      const result = await chai
        .request(apiAddress)
        .post('/admin/config')
        .set(sysadminAuthHeader)
        .send({
          retentionTimeInDays: null,
          active: false,
        });

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({
        retentionTimeInDays: null,
        active: false,
      });

      const events = await dataSource.getRepository(Event).count();

      expect(events).to.equal(0);
    });

    it('should return HTTP 400 if retentionTimeInDays is null and active is true', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/config')
        .set(sysadminAuthHeader)
        .send({
          retentionTimeInDays: null,
          active: true,
        });

      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 401 if the user has no valid token', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/config')
        .set({ authorization: 'Bearer invalid' })
        .send({
          retentionTimeInDays: null,
          active: true,
        });

      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if the user is not a SysAdmin', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/config')
        .set(professionalAuthHeader)
        .send({
          retentionTimeInDays: null,
          active: true,
        });

      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });
});
