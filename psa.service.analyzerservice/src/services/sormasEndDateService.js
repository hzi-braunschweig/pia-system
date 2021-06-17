require('datejs');
const { SormasserviceClient } = require('../clients/sormasserviceClient');

/**
 * @description fetches sormas end dates and returns end dates for specific users
 */
const sormasEndDateService = (function () {
  /**
   * Caches the end dates from sormasservice
   *
   * @type {Map<string, Date>}
   * @private
   */
  let _endDateCache = new Map();

  /**
   * Starts with current Date in order to fill the cache initially.
   *
   * Cache expiration is later set to next day 0:00h in order to only fetch
   * once while checkAndUpdateQuestionnaireInstancesStatus is running.
   *
   * @type {Date}
   * @private
   */
  let _cacheExpiration = Date.today();

  /**
   * Defines time from which results should be fetched
   *
   * Here we need to consider the length of possible down times
   * during which data won't be fetched and processed.
   * This time is currently set to 14 days in the past.
   *
   * @type {Date}
   * @private
   */
  let _fetchSinceParam = _getFetchSinceParam();

  /**
   * Returns end date of user with uuid or undefined if not found
   *
   * @param uuid
   * @returns {Promise<Date | undefined>}
   */
  async function getEndDateForUUID(uuid) {
    if (_isCacheRefreshNeeded()) {
      await _fetchEndDates();
    }
    return _endDateCache.get(uuid);
  }

  /**
   * Fetches end dates from sormasservice and refreshes the cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async function _fetchEndDates() {
    const sormasEndDates =
      await SormasserviceClient.getEndDatesForSormasProbands(_fetchSinceParam);
    if (Array.isArray(sormasEndDates)) {
      _endDateCache = _convertToMap(sormasEndDates);
      _cacheExpiration = _getCacheExpirationDate();
      _fetchSinceParam = _getFetchSinceParam();
    }
  }

  /**
   * Will check if cache is expired
   *
   * @returns {boolean}
   * @private
   */
  function _isCacheRefreshNeeded() {
    return Date.now() > _cacheExpiration.getTime();
  }

  /**
   * Converts a list of results into a Map which keys are UUIDs and which values
   * are the corresponding followUpEndDates. Removes values which are not of
   * type number.
   *
   * @param followUpEndList {{latestFollowUpEndDate: number, personUuid: string}[]}
   * @returns {Map<string, Date>}
   * @private
   */
  function _convertToMap(followUpEndList) {
    // When the latestFollowUpEndDate equals NULL, then no more follow-ups are to be expected.
    // Moreover, the Proband will be deleted from PIA and all actual answers are ought to be sent to Sormas
    const keyValuePairList = followUpEndList.map((entry) => [
      entry.personUuid,
      new Date(entry.latestFollowUpEndDate),
    ]);
    return new Map(keyValuePairList);
  }

  function _getCacheExpirationDate() {
    return Date.today().addDays(1);
  }

  function _getFetchSinceParam() {
    return Date.today().addDays(-14);
  }

  return {
    /**
     * Returns end date of user with uuid or undefined if not found
     *
     * @param uuid
     * @returns {Promise<Date | undefined>}
     */
    getEndDateForUUID: getEndDateForUUID,
  };
})();

module.exports = sormasEndDateService;
