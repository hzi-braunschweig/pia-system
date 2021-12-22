/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @description json REST presenter
 */
const RESTPresenter = (function () {
  function constructUserSettingsLinks(id) {
    return {
      self: { href: '/userSettings/' + id },
    };
  }

  function constructPlannedProbandLinks(user_id) {
    return {
      self: { href: '/plannedprobands/' + user_id },
    };
  }

  function constructPlannedProbandsLinks() {
    return {
      self: { href: '/plannedprobands' },
    };
  }

  function presentUserSettings(settingsObj, userName) {
    if (settingsObj) {
      settingsObj.links = constructUserSettingsLinks(userName);
    }
    return settingsObj;
  }

  function presentPlannedProbands(plannedProbandsArr) {
    const ret = {};
    ret.plannedprobands = plannedProbandsArr;
    ret.links = constructPlannedProbandsLinks();

    return ret;
  }

  function presentPlannedProband(plannedProbandsObj) {
    if (plannedProbandsObj) {
      plannedProbandsObj.links = constructPlannedProbandLinks(
        plannedProbandsObj.user_id
      );
    }
    return plannedProbandsObj;
  }

  return {
    /**
     * @function
     * @description presents a user settings object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} settingsObj the user object to present
     * @param {string} userName the username of the settings object
     * @returns a user settings object as a REST compliant json object
     */
    presentUserSettings: presentUserSettings,

    /**
     * @function
     * @description presents a planned probands array as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {array} plannedProbandsArr the array of planned probands to present
     * @returns a planned probands array as a REST compliant json object
     */
    presentPlannedProbands: presentPlannedProbands,

    /**
     * @function
     * @description presents a planned proband object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {array} plannedProbandsObj the object of the planned proband to present
     * @returns a planned proband object as a REST compliant json object
     */
    presentPlannedProband: presentPlannedProband,
  };
})();

module.exports = RESTPresenter;
