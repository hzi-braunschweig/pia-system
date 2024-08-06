/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { JobSchedulerServer } from '../../src/server';
import { CronService } from '../../src/services/cronService';

chai.use(sinonChai);

describe('Server', () => {
  it('should start and stop all cronjobs', async () => {
    const cronService = new CronService();
    const cronServiceSpy = sinon.spy(cronService);
    const server = new JobSchedulerServer(cronService);

    await server.init();
    expect(cronServiceSpy.setup).to.have.been.calledOnce;
    expect(cronServiceSpy.startAll).to.have.been.calledOnce;

    await server.stop();
    expect(cronServiceSpy.stopAll).to.have.been.calledOnce;
  });
});
