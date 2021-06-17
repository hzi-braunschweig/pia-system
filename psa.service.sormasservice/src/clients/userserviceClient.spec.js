const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const fetch = require('node-fetch');
const { config } = require('../config');
const userserviceClient = require('./userserviceClient.js');

describe('userserviceClient', () => {
  let fetchStub;
  beforeEach(() => {
    sandbox
      .stub(config.services.userservice, 'url')
      .value('http://userservice:5000');
    fetchStub = sandbox.stub(fetch, 'default').resolves({ ok: true });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('deleteUserdata', () => {
    it('should call userservice to delete user data', async () => {
      await userserviceClient.deleteUserdata('derUser', true);

      sinon.assert.calledOnce(fetchStub);
      sinon.assert.calledWithExactly(
        fetchStub,
        'http://userservice:5000/user/users/derUser?keepUsageData=true',
        { method: 'delete' }
      );
    });
  });
});
