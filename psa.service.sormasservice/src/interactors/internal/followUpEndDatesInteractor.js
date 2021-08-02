/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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
