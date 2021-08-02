/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const { RESTPresenter } = require('../services/RESTPresenter');
const studyAccessesInteractor = require('../interactors/studyAccessesInteractor.js');

/**
 * @description HAPI Handler for study accesses
 */
const studyAccessesHandler = (function () {
  function getOne(request) {
    const study_name = request.params.name;
    const username = request.params.username;

    return studyAccessesInteractor
      .getStudyAccess(
        request.auth.credentials,
        study_name,
        username,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentStudyAccess(result);
      })
      .catch((err) => {
        console.log('Could not get study access from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function getAll(request) {
    const study_name = request.params.name;

    return studyAccessesInteractor
      .getStudyAccesses(request.auth.credentials, study_name, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentStudyAccesses(result, study_name);
      })
      .catch((err) => {
        console.log('Could not get study accesses from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function deleteOne(request) {
    const study_name = request.params.name;
    const username = request.params.username;

    return studyAccessesInteractor
      .deleteStudyAccess(
        request.auth.credentials,
        study_name,
        username,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentStudyAccess(result);
      })
      .catch((err) => {
        console.log('Could not delete study access from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function createOne(request) {
    const study_name = request.params.name;
    const study_access = request.payload;

    return studyAccessesInteractor
      .createStudyAccess(
        request.auth.credentials,
        study_name,
        study_access,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentStudyAccess(result);
      })
      .catch((err) => {
        console.log('Could not create study access in DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function updateOne(request) {
    const study_name = request.params.name;
    const username = request.params.username;
    const study_access = request.payload;

    return studyAccessesInteractor
      .updateStudyAccess(
        request.auth.credentials,
        study_name,
        username,
        study_access,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentStudyAccess(result);
      })
      .catch((err) => {
        console.log('Could not update study access in DB: ' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description gets the study access if the user has access
     * @memberof module:studyAccessesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description get all study accesses the user has access to
     * @memberof module:studyAccessesHandler
     */
    getAll: getAll,

    /**
     * @function
     * @description deletes the study access if the user has access
     * @memberof module:studyAccessesHandler
     */
    deleteOne: deleteOne,

    /**
     * @function
     * @description creates the study access if the user has access
     * @memberof module:studyAccessesHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the study access if the user has access
     * @memberof module:studyAccessesHandler
     */
    updateOne: updateOne,
  };
})();

module.exports = studyAccessesHandler;
