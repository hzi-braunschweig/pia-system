const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('sormasEndDateService', () => {
  let sormasEndDateService;
  let sormasClientStub;

  before(() => {
    sormasClientStub = { getEndDatesForSormasProbands: sinon.stub() };
    sormasClientStub.getEndDatesForSormasProbands.resolves([
      { latestFollowUpEndDate: 1597960800000, personUuid: 'ABCDEF' },
    ]);
    sormasEndDateService = proxyquire(
      '../../src/services/sormasEndDateService.js',
      {
        '../clients/sormasserviceClient': {
          SormasserviceClient: sormasClientStub,
        },
      }
    );
  });

  describe('getEndDateForUUID', () => {
    beforeEach(() => {
      sormasClientStub.getEndDatesForSormasProbands.resetHistory();
    });

    it('should fill the cache with data from sormas client and return data', async () => {
      const uuid = 'ABCDEF';
      const result = await sormasEndDateService.getEndDateForUUID(uuid);

      sinon.assert.calledOnce(sormasClientStub.getEndDatesForSormasProbands);
      sinon.assert.match(result.toISOString(), '2020-08-20T22:00:00.000Z');
    });

    it('should return cached data', async () => {
      const uuid = 'ABCDEF';
      const result = await sormasEndDateService.getEndDateForUUID(uuid);

      sinon.assert.notCalled(sormasClientStub.getEndDatesForSormasProbands);
      sinon.assert.match(result.toISOString(), '2020-08-20T22:00:00.000Z');
    });

    it('should return undefined if uuid was not found', async () => {
      const uuid = 'DoNotExist';
      const result = await sormasEndDateService.getEndDateForUUID(uuid);

      sinon.assert.match(result, undefined);
    });
  });
});
