/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @description json REST presenter
 */
const RESTPresenter = (function () {
  function constructUserLinks(id) {
    return {
      self: { href: '/users/' + id },
    };
  }

  function constructUserSettingsLinks(id) {
    return {
      self: { href: '/userSettings/' + id },
    };
  }

  function constructUsersLinks() {
    return {
      self: { href: '/users' },
    };
  }

  function constructPlannedProbandLinks(user_id) {
    return {
      self: { href: '/plannedprobands/' + user_id },
    };
  }

  function constructProbandToContactLinks() {
    return {
      self: { href: '/probandstocontact' },
    };
  }

  function constructPlannedProbandsLinks() {
    return {
      self: { href: '/plannedprobands' },
    };
  }

  function presentUser(userObj) {
    if (userObj) {
      userObj.links = constructUserLinks(userObj.username);
    }
    return userObj;
  }

  function presentUsers(usersArr) {
    const ret = {};
    ret.users = usersArr;
    ret.links = constructUsersLinks();

    return ret;
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

  function presentProbandsToContact(probandToContactObj) {
    const ret = {};
    ret.probands = probandToContactObj;
    ret.links = constructProbandToContactLinks();
    return ret;
  }

  return {
    /**
     * @function
     * @description presents a user object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} userObj the user object to present
     * @returns a user object as a REST compliant json object
     */
    presentUser: presentUser,

    /**
     * @function
     * @description presents an array of users as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {object} usersArr the user array to present
     * @returns a users object as a REST compliant json object
     */
    presentUsers: presentUsers,

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

    /**
     * @function
     * @description presents a proband to contact object as a REST compliant json object
     * @memberof module:RESTPresenter
     * @param {array} probandsToContactObj the object of the probands to present
     * @returns a proband to contact object as a REST compliant json object
     */
    presentProbandsToContact: presentProbandsToContact,
  };
})();

module.exports = RESTPresenter;
