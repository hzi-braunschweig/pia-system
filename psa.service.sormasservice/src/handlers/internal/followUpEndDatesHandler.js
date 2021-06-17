const followUpEndDatesInteractor = require('../../interactors/internal/followUpEndDatesInteractor');

const followUpEndDatesHandler = (function () {
  function getLatestFollowUpEndDates(request) {
    const since = request.params.since;

    return followUpEndDatesInteractor.getLatestFollowUpEndDates(since);
  }

  return {
    /**
     * Gets the latest follow up updates
     * @param {Object} request
     * @param {Object} reply
     */
    getLatestFollowUpEndDates: getLatestFollowUpEndDates,
  };
})();

module.exports = followUpEndDatesHandler;
