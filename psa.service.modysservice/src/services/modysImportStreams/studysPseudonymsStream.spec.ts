import chai, { expect } from 'chai';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import sinonChai from 'sinon-chai';
import Boom from '@hapi/boom';
import stream from 'stream';
import { promisify } from 'util';
import { UserserviceClient } from '../../clients/userserviceClient';
import { getStudysPseudonymsReadable } from './studysPseudonymsStream';
import { WriteIntoArrayStream } from '@pia/lib-service-core';

const pipeline = promisify(stream.pipeline);

chai.use(sinonChai);
const sandbox = createSandbox();

describe('StudysPseudonymsStream', () => {
  let userserviceClientStubbed: SinonStubbedInstance<typeof UserserviceClient>;
  beforeEach(() => {
    // sandbox.restore() is currently not working for sandbox.stub(class)
    userserviceClientStubbed = {
      getPseudonyms: sandbox.stub(UserserviceClient, 'getPseudonyms'),
      prototype: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should end the stream with no error, if userservice is not available', async () => {
    // Arrange
    userserviceClientStubbed.getPseudonyms.rejects(
      Boom.internal('userservice not available')
    );
    const results: string[] = [];

    // Act
    const studysPseudonymsReadable = getStudysPseudonymsReadable('My Study');
    await pipeline(studysPseudonymsReadable, new WriteIntoArrayStream(results));

    // Assert
    expect(studysPseudonymsReadable.readableEnded).to.be.true;
    expect(userserviceClientStubbed.getPseudonyms).to.have.been.calledOnce;
    expect(results).to.be.empty;
  });

  it('should end the stream with no error, if no pseudonyms in given study', async () => {
    // Arrange
    const pseudonyms: string[] = [];
    userserviceClientStubbed.getPseudonyms.resolves(pseudonyms);
    const results: string[] = [];

    // Act
    const studysPseudonymsReadable = getStudysPseudonymsReadable('My Study');
    await pipeline(studysPseudonymsReadable, new WriteIntoArrayStream(results));

    // Assert
    expect(studysPseudonymsReadable.readableEnded).to.be.true;
    expect(userserviceClientStubbed.getPseudonyms).to.have.been.calledOnce;
    expect(results).to.deep.equal(pseudonyms);
  });

  it('should push all pseudonyms from userservice', async () => {
    // Arrange
    const pseudonyms: string[] = ['TEST-0001', 'TEST-0002', 'TEST-0003'];
    userserviceClientStubbed.getPseudonyms.resolves(pseudonyms);
    const results: string[] = [];

    // Act
    const studysPseudonymsReadable = getStudysPseudonymsReadable('My Study');
    await pipeline(studysPseudonymsReadable, new WriteIntoArrayStream(results));

    // Assert
    expect(studysPseudonymsReadable.readableEnded).to.be.true;
    expect(userserviceClientStubbed.getPseudonyms).to.have.been.calledOnce;
    expect(results).to.deep.equal(pseudonyms);
  });
});
