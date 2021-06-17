const postgresqlHelper = require('../services/postgresqlHelper.js');
const pendingComplianceChangesInteractor = require('../interactors/pendingComplianceChangesInteractor.js');

/**
 * @description HAPI Handler for pending compliance changes
 */
const pendingComplianceChangesHandler = (function () {
  function getOne(request) {
    const id = request.params.id;

    return pendingComplianceChangesInteractor.getPendingComplianceChange(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function getOneForProband(request) {
    const probandId = request.params.id;

    return pendingComplianceChangesInteractor.getPendingComplianceChangeForProband(
      request.auth.credentials,
      probandId,
      postgresqlHelper
    );
  }

  function createOne(request) {
    return pendingComplianceChangesInteractor.createPendingComplianceChange(
      request.auth.credentials,
      request.payload,
      postgresqlHelper
    );
  }

  function updateOne(request) {
    const id = request.params.id;

    return pendingComplianceChangesInteractor.updatePendingComplianceChange(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function deleteOne(request) {
    const id = request.params.id;

    return pendingComplianceChangesInteractor.deletePendingComplianceChange(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  return {
    /**
     * @function
     * @description gets the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description gets the pending compliance change for a proband
     * @memberof module:pendingComplianceChangesHandler
     */
    getOneForProband: getOneForProband,

    /**
     * @function
     * @description creates the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description deletes the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = pendingComplianceChangesHandler;
