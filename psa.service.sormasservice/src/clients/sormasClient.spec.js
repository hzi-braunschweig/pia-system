const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');

describe('sormasClient', function () {
  describe('getLatestFollowUpEndDates', function () {
    const sinceTimestamp = '1580511600000';

    it('should perform a fetch', async () => {
      // Arrange
      const fetchStub = createFetchStub(
        JSON.stringify([
          {
            latestFollowUpEndDate: '2020-09-24T22:00:00.000Z',
            personUuid: 'ABCDEF',
          },
        ])
      );
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': fetchStub,
        '../config': getConfig(),
      });

      // Act
      const result = await sormasClient.getLatestFollowUpEndDates(
        sinceTimestamp
      );

      // Assert
      sinon.assert.calledOnce(fetchStub);
      sinon.assert.calledWithExactly(
        fetchStub,
        'https://sb.sormas.netzlink.com/sormas-rest/visits-external/followUpEndDates/1580511600000',
        {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' + Buffer.from('derUser:dasPasswort').toString('base64'),
          },
        }
      );
      sinon.assert.match(result, [
        {
          latestFollowUpEndDate: '2020-09-24T22:00:00.000Z',
          personUuid: 'ABCDEF',
        },
      ]);
    });

    it('should return an error if no response was received', async () => {
      // Arrange
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': sinon.stub().returns(undefined),
        '../config': getConfig(),
      });

      // Act
      const result = await sormasClient.getLatestFollowUpEndDates(
        sinceTimestamp
      );

      // Assert
      expect(result).to.be.an('error');
    });

    it('should return an error if response is empty', async () => {
      // Arrange
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': sinon
          .stub()
          .resolves({ text: sinon.stub().resolves(undefined), ok: true }),
        '../config': getConfig(),
      });

      // Act
      const result = await sormasClient.getLatestFollowUpEndDates(
        sinceTimestamp
      );

      // Assert
      expect(result).to.be.an('error');
    });
    it('should return an error if response has bad status code', async () => {
      // Arrange
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': sinon.stub().resolves({
          text: sinon.stub().resolves('Not Found'),
          ok: false,
          status: 404,
        }),
        '../config': getConfig(),
      });

      // Act
      const result = await sormasClient.getLatestFollowUpEndDates(
        sinceTimestamp
      );

      // Assert
      expect(result).to.be.an('error');
    });
  });

  describe('uploadVisit', function () {
    it('should perform a fetch with meaningful data', function () {
      // Arrange
      const fetchStub = createFetchStub(JSON.stringify(['OK']));
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': fetchStub,
      });
      const sormasData = { test: 'value' };

      // Act
      sormasClient.uploadVisit('ABCDEF', new Date(), 1, sormasData);

      // Assert
      expect(fetchStub.callCount).to.equal(1);
      const args = fetchStub.getCall(0).args;
      expect(args[0])
        .to.be.a('string')
        .and.satisfy((msg) => msg.endsWith('sormas-rest/visits-external/'));
      expect(args[1]).to.be.a('object');
      expect(args[1].method).to.equal('post');
      const body = JSON.parse(args[1].body);
      expect(body[0].personUuid).to.equal('ABCDEF');
      expect(body[0].disease).to.equal('CORONAVIRUS');
      expect(body[0].visitStatus).not.to.be.undefined;
      expect(body[0].symptoms).to.eql(sormasData);
    });
  });

  describe('getApiVersion', () => {
    it('should fetch the api version', async () => {
      // Arrange
      const fetchStub = createFetchStub('1.41.0');
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': fetchStub,
      });

      // Act
      const version = await sormasClient.getApiVersion();

      // Assert
      expect(version).to.equal('1.41.0');
    });

    it('should return null if API is unavailable', async () => {
      // Arrange
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': sinon.stub().rejects(),
      });

      // Act
      const version = await sormasClient.getApiVersion();

      // Assert
      expect(version).to.be.null;
    });
  });

  describe('setStatus', () => {
    it('should post a users status', async () => {
      // Arrange
      const fetchStub = createFetchStub('true');
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': fetchStub,
      });

      // Act
      await sormasClient.setStatus('ABCD-EFGH', 'REGISTERED');

      // Assert
      expect(fetchStub.callCount).to.equal(1);
      const args = fetchStub.getCall(0).args;
      expect(args[0])
        .to.be.a('string')
        .and.satisfy((msg) =>
          msg.endsWith('sormas-rest/visits-external/person/ABCD-EFGH/status')
        );
      expect(args[1]).to.be.a('object');
      expect(args[1].method).to.equal('post');
      expect(JSON.parse(args[1].body)).to.be.a('object');
      expect(JSON.parse(args[1].body).status).to.equal('REGISTERED');
    });

    it('should return throw an error if API returned "false"', async () => {
      // Arrange
      const fetchStub = createFetchStub('false');
      const sormasClient = proxyquire('./sormasClient.js', {
        'node-fetch': fetchStub,
      });
      const executePost = async () =>
        await sormasClient.setStatus('ABCD-EFGH', 'REGISTERED');

      // Act
      // Assert
      await expect(executePost()).to.be.rejectedWith(Error);
    });
  });

  function createFetchStub(resolveData) {
    const stub1 = sinon.stub();
    const stub2 = sinon.stub();
    stub1.resolves({ text: stub2, ok: true });
    stub2.resolves(resolveData);
    return stub1;
  }

  function getConfig() {
    return {
      config: {
        sormas: {
          url: 'https://sb.sormas.netzlink.com',
          username: 'derUser',
          password: 'dasPasswort',
        },
      },
    };
  }
});
