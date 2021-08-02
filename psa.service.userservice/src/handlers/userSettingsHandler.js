/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const userSettingsInteractor = require('../interactors/userSettingsInteractor.js');

/**
 * @description HAPI Handler for users
 */
const userSettingsHandler = (function () {
  function updateOne(request) {
    const username = request.params.username;
    const settingsValues = request.payload;

    return userSettingsInteractor
      .updateUserSettings(
        request.auth.credentials,
        username,
        settingsValues,
        postgresqlHelper
      )
      .then((result) => RESTPresenter.presentUserSettings(result, username))
      .catch((err) => {
        console.log('Could not update user settings in DB:' + err);
        return Boom.notFound(err);
      });
  }

  function getOne(request) {
    const username = request.params.username;

    return userSettingsInteractor
      .getUserSettings(request.auth.credentials, username, postgresqlHelper)
      .then((result) => RESTPresenter.presentUserSettings(result, username))
      .catch((err) => {
        console.log('Could not get user settings from DB:' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description updates the users settings
     * @memberof module:userSettingsHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description gets the users settings
     * @memberof module:userSettingsHandler
     */
    getOne: getOne,
  };
})();

module.exports = userSettingsHandler;
