/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/unbound-method */

import chai, { expect } from 'chai';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import sinonChai from 'sinon-chai';
import Boom from '@hapi/boom';
import stream from 'stream';
import { promisify } from 'util';
import { getStudysPseudonymsReadable } from './studysPseudonymsStream';
import { WriteIntoArrayStream } from '@pia/lib-service-core';
import { UserserviceClient } from '@pia-system/lib-http-clients-internal';
import { userserviceClient } from '../../clients/userserviceClient';
import { ProbandExternalId } from '../../models/probandExternalId';

const pipeline = promisify(stream.pipeline);

chai.use(sinonChai);
const sandbox = createSandbox();

describe('StudysPseudonymsStream', () => {
  let userserviceClientStubbed: SinonStubbedInstance<UserserviceClient>;

  beforeEach(() => {
    userserviceClientStubbed = sandbox.stub(userserviceClient);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should end the stream with no error, if userservice is not available', async () => {
    // Arrange
    userserviceClientStubbed.getExternalIds.rejects(
      Boom.internal('userservice not available')
    );
    const results: string[] = [];

    // Act
    const studysPseudonymsReadable = getStudysPseudonymsReadable('My Study');
    await pipeline(studysPseudonymsReadable, new WriteIntoArrayStream(results));

    // Assert
    expect(studysPseudonymsReadable.readableEnded).to.be.true;
    expect(userserviceClientStubbed.getExternalIds).to.have.been.calledOnce;
    expect(results).to.be.empty;
  });

  it('should end the stream with no error, if no pseudonyms in given study', async () => {
    // Arrange
    const pseudonyms: ProbandExternalId[] = [];
    userserviceClientStubbed.getExternalIds.resolves(pseudonyms);
    const results: string[] = [];

    // Act
    const studysPseudonymsReadable = getStudysPseudonymsReadable('My Study');
    await pipeline(studysPseudonymsReadable, new WriteIntoArrayStream(results));

    // Assert
    expect(studysPseudonymsReadable.readableEnded).to.be.true;
    expect(userserviceClientStubbed.getExternalIds).to.have.been.calledOnce;
    expect(results).to.deep.equal(pseudonyms);
  });

  it('should push all pseudonyms from userservice', async () => {
    // Arrange
    const pseudonyms: ProbandExternalId[] = [
      {
        pseudonym: 'test-0001',
        externalId: 'TEST-0001',
      },
      {
        pseudonym: 'test-0002',
        externalId: 'TEST-0002',
      },
      {
        pseudonym: 'test-0003',
        externalId: 'TEST-0003',
      },
    ];
    userserviceClientStubbed.getExternalIds.resolves(pseudonyms);
    const results: string[] = [];

    // Act
    const studysPseudonymsReadable = getStudysPseudonymsReadable('My Study');
    await pipeline(studysPseudonymsReadable, new WriteIntoArrayStream(results));

    // Assert
    expect(studysPseudonymsReadable.readableEnded).to.be.true;
    expect(userserviceClientStubbed.getExternalIds).to.have.been.calledOnce;
    expect(results).to.deep.equal(pseudonyms);
  });
});
