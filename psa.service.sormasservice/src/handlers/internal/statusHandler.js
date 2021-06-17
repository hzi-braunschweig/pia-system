const statusInteractor = require('../../interactors/internal/statusInteractor');

/**
 * @description HAPI Handler for setting the status
 */
const statusHandler = function () {
  async function setStatus(request) {
    console.log(
      'Got setStatus request for ' + request.payload.uuid.substr(0, 6) + '...'
    );
    return statusInteractor.setStatus(
      request.payload.uuid,
      request.payload.status
    );
  }

  return {
    setStatus: setStatus,
  };
};

module.exports = statusHandler();
