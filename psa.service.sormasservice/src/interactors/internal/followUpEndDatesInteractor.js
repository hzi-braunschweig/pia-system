const sormasClient = require('../../clients/sormasClient');

const followUpEndDatesInteractor = (function () {
  function getLatestFollowUpEndDates(since) {
    return sormasClient.getLatestFollowUpEndDates(since);
  }

  return {
    getLatestFollowUpEndDates: getLatestFollowUpEndDates,
  };
})();

module.exports = followUpEndDatesInteractor;
