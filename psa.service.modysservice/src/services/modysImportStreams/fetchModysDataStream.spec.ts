import chai, { expect } from 'chai';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import stream, { Readable } from 'stream';
import { promisify } from 'util';
import Boom from '@hapi/boom';
import { WriteIntoArrayStream } from '@pia/lib-service-core';
import { config } from '../../config';
import { ModysConfig, PersonSummary } from '../../models/modys';
import { ContactDetailTypeId } from '../../models/modysApi';
import { ModysClient } from '../../clients/modysClient';
import { FetchModysDataStream } from './fetchModysDataStream';

const pipeline = promisify(stream.pipeline);

chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = createSandbox();

describe('FetchModysDataStream', () => {
  let modysClientInstanceStubbed: SinonStubbedInstance<ModysClient>;
  const testModysConfig: ModysConfig = {
    baseUrl: '',
    identifierTypeId: 1,
    username: '',
    password: '',
    study: 'My Study',
  };

  beforeEach(() => {
    modysClientInstanceStubbed = sandbox.stub(ModysClient.prototype);
    sandbox.stub(config, 'modysRequestConcurrency').value(1);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should end the stream without doing anything, if nothing written into the stream', async () => {
    // Arrange
    const fetchModysDataStream = new FetchModysDataStream(testModysConfig);
    const results: Promise<PersonSummary | null>[] = [];
    const pseudonyms: string[] = [];

    // Act
    await pipeline(
      Readable.from(pseudonyms),
      fetchModysDataStream,
      new WriteIntoArrayStream<Promise<PersonSummary | null>>(results)
    );

    // Assert
    expect(fetchModysDataStream.readableEnded).to.be.true;
    expect(fetchModysDataStream.writableEnded).to.be.true;
    expect(modysClientInstanceStubbed.getProbandIdentifierbyId).to.have.not.been
      .called;
    expect(modysClientInstanceStubbed.getProbandWithId).to.have.not.been.called;
    expect(modysClientInstanceStubbed.getProbandContactDetails).to.have.not.been
      .called;
    expect(results).to.be.empty;
  });

  it('should push a promise resolving null, if modys is not available', async () => {
    // Arrange
    modysClientInstanceStubbed.getProbandIdentifierbyId.rejects(
      Boom.serverUnavailable('ModysClient fetch: received an Error')
    );
    const fetchModysDataStream = new FetchModysDataStream(testModysConfig);
    const results: Promise<PersonSummary | null>[] = [];
    const pseudonyms = ['TEST-1234'];

    // Act
    await pipeline(
      Readable.from(pseudonyms),
      fetchModysDataStream,
      new WriteIntoArrayStream<Promise<PersonSummary | null>>(results)
    );

    // Assert
    expect(fetchModysDataStream.readableEnded).to.be.true;
    expect(fetchModysDataStream.writableEnded).to.be.true;
    expect(modysClientInstanceStubbed.getProbandIdentifierbyId).to.have.been
      .calledOnce;
    expect(modysClientInstanceStubbed.getProbandWithId).to.have.not.been.called;
    expect(modysClientInstanceStubbed.getProbandContactDetails).to.have.not.been
      .called;
    expect(results).to.have.lengthOf(1);
    void expect(results[0]).to.eventually.be.null;
  });

  it('should push a promise resolving null, if proband cannot be found in modys', async () => {
    // Arrange
    modysClientInstanceStubbed.getProbandWithId.rejects(
      Boom.notFound('ModysClient fetch: received an Error')
    );
    const fetchModysDataStream = new FetchModysDataStream(testModysConfig);
    const results: Promise<PersonSummary | null>[] = [];
    const pseudonyms = ['TEST-1234'];

    // Act
    await pipeline(
      Readable.from(pseudonyms),
      fetchModysDataStream,
      new WriteIntoArrayStream<Promise<PersonSummary | null>>(results)
    );

    // Assert
    expect(fetchModysDataStream.readableEnded).to.be.true;
    expect(fetchModysDataStream.writableEnded).to.be.true;
    expect(modysClientInstanceStubbed.getProbandIdentifierbyId).to.have.been
      .calledOnce;
    expect(modysClientInstanceStubbed.getProbandWithId).to.have.not.been.called;
    expect(modysClientInstanceStubbed.getProbandContactDetails).to.have.not.been
      .called;
    expect(results).to.have.lengthOf(1);
    void expect(results[0]).to.eventually.be.null;
  });

  it('should do the import for one proband', async () => {
    // Arrange
    modysClientInstanceStubbed.getProbandIdentifierbyId.resolves('ID-1234');
    modysClientInstanceStubbed.getProbandWithId.resolves({
      firstname: 'Test',
      name: 'Person',
    });
    modysClientInstanceStubbed.getProbandContactDetails.resolves([
      {
        contactDetailTypeId: ContactDetailTypeId.EMAIL,
        value: 'person@example.com',
      },
    ]);
    const fetchModysDataStream = new FetchModysDataStream(testModysConfig);
    const results: Promise<PersonSummary | null>[] = [];
    const pseudonyms = ['TEST-1234'];

    // Act
    await pipeline(
      Readable.from(pseudonyms),
      fetchModysDataStream,
      new WriteIntoArrayStream<Promise<PersonSummary | null>>(results)
    );

    // Assert
    expect(fetchModysDataStream.readableEnded).to.be.true;
    expect(fetchModysDataStream.writableEnded).to.be.true;
    expect(
      modysClientInstanceStubbed.getProbandIdentifierbyId
    ).to.have.been.to.have.been.calledOnceWith(
      'TEST-1234',
      testModysConfig.identifierTypeId
    );
    expect(modysClientInstanceStubbed.getProbandWithId).to.have.been.calledOnce;
    expect(modysClientInstanceStubbed.getProbandContactDetails).to.have.been
      .calledOnce;
    expect(results).to.have.lengthOf(1);
    const expected: PersonSummary = {
      contactDetails: [
        {
          contactDetailTypeId: ContactDetailTypeId.EMAIL,
          value: 'person@example.com',
        },
      ],
      overview: {
        firstname: 'Test',
        name: 'Person',
      },
      pseudonym: 'TEST-1234',
    };
    void expect(results[0]).to.eventually.deep.equal(expected);
  });

  it('should do the import for multiple probands', async () => {
    // Arrange
    modysClientInstanceStubbed.getProbandIdentifierbyId
      .withArgs('TEST-0001', testModysConfig.identifierTypeId)
      .resolves('ID-0001');
    modysClientInstanceStubbed.getProbandIdentifierbyId
      .withArgs('TEST-0002', testModysConfig.identifierTypeId)
      .resolves('ID-0002');
    modysClientInstanceStubbed.getProbandIdentifierbyId
      .withArgs('TEST-0003', testModysConfig.identifierTypeId)
      .resolves('ID-0003');
    modysClientInstanceStubbed.getProbandWithId.resolves({
      firstname: 'Test',
      name: 'Person',
    });
    modysClientInstanceStubbed.getProbandContactDetails.resolves([
      {
        contactDetailTypeId: ContactDetailTypeId.EMAIL,
        value: 'person@example.com',
      },
    ]);
    const fetchModysDataStream = new FetchModysDataStream(testModysConfig);
    const results: Promise<PersonSummary | null>[] = [];
    const pseudonyms = ['TEST-0001', 'TEST-0002', 'TEST-0003'];

    // Act
    await pipeline(
      Readable.from(pseudonyms),
      fetchModysDataStream,
      new WriteIntoArrayStream<Promise<PersonSummary | null>>(results)
    );

    // Assert
    expect(fetchModysDataStream.readableEnded).to.be.true;
    expect(fetchModysDataStream.writableEnded).to.be.true;
    expect(
      modysClientInstanceStubbed.getProbandIdentifierbyId
    ).to.have.been.calledWith('TEST-0001', testModysConfig.identifierTypeId);
    expect(
      modysClientInstanceStubbed.getProbandIdentifierbyId
    ).to.have.been.calledWith('TEST-0003', testModysConfig.identifierTypeId);
    expect(modysClientInstanceStubbed.getProbandWithId).to.have.been
      .calledThrice;
    expect(modysClientInstanceStubbed.getProbandContactDetails).to.have.been
      .calledThrice;
    expect(results).to.have.lengthOf(pseudonyms.length);
  });
});
