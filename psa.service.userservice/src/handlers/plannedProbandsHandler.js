/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const plannedProbandsInteractor = require('../interactors/plannedProbandsInteractor.js');

/**
 * @description HAPI Handler for planned probands
 */
const plannedProbandsHandler = (function () {
  function getAll(request) {
    return plannedProbandsInteractor
      .getPlannedProbands(request.auth.credentials, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentPlannedProbands(result);
      })
      .catch((err) => {
        console.log('Could not get users from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function getOne(request) {
    const user_id = request.params.user_id;

    return plannedProbandsInteractor
      .getPlannedProband(request.auth.credentials, user_id, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentPlannedProband(result);
      })
      .catch((err) => {
        console.log('Could not create user: ' + err);
        return Boom.notFound(err);
      });
  }

  function createSome(request) {
    return plannedProbandsInteractor
      .createPlannedProbands(
        request.auth.credentials,
        request.payload.pseudonyms,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentPlannedProbands(result);
      })
      .catch((err) => {
        console.log('Could not create user in DB: ' + err);
        return Boom.conflict(err);
      });
  }

  function deleteOne(request) {
    const user_id = request.params.user_id;

    return plannedProbandsInteractor
      .deletePlannedProband(request.auth.credentials, user_id, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentPlannedProband(result);
      })
      .catch((err) => {
        console.log('Could not delete user from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description get all planned probands the user has access to
     * @memberof module:plannedProbandsHandler
     */
    getAll: getAll,

    /**
     * @function
     * @description gets the planned proband if the user has access
     * @memberof module:plannedProbandsHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description creates all planned probands that do not exist already
     * @memberof module:plannedProbandsHandler
     */
    createSome: createSome,

    /**
     * @function
     * @description deletes the planned proband if the user has access
     * @memberof module:plannedProbandsHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = plannedProbandsHandler;
