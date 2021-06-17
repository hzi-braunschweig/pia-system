const sormasClient = require('../../clients/sormasClient');

const statusInteractor = (function () {
  async function setStatus(uuid, status) {
    return sormasClient.setStatus(uuid, status);
  }

  return {
    setStatus: setStatus,
  };
})();

module.exports = statusInteractor;
