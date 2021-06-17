const postgresqlHelper = require('../services/postgresqlHelper');
const materialInteractor = require('../interactors/materialInteractor');

/**
 * @description HAPI Handler for material
 */
const materialHandler = (function () {
  function requestNewMaterial(request) {
    return materialInteractor.requestNewMaterial(
      request.auth.credentials,
      request.params.username,
      postgresqlHelper
    );
  }

  return {
    /**
     * @function
     * @description creates request for new material
     * @memberof module:materialHandler
     */
    requestNewMaterial: requestNewMaterial,
  };
})();

module.exports = materialHandler;
