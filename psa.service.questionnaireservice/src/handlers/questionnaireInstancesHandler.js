/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { RESTPresenter } = require('../services/RESTPresenter');
const questionnaireInstancesInteractor = require('../interactors/questionnaireInstancesInteractor.js');

/**
 * @description HAPI Handler for questionnaire instances
 */
const questionnaireInstancesHandler = (function () {
  function getOne(request) {
    const id = request.params.id;

    return questionnaireInstancesInteractor
      .getQuestionnaireInstance(request.auth.credentials, id)
      .then(function (result) {
        return RESTPresenter.presentQuestionnaireInstance(result);
      })
      .catch((err) => {
        console.log('Could not get questionnaire instance from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  /**
   * Gets all questionnaire instances for the requesting user filtered by the status
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<{} | Boom>}
   */
  function getAll(request) {
    return questionnaireInstancesInteractor
      .getQuestionnaireInstances(request.auth.credentials, request.query.status)
      .then(function (result) {
        return RESTPresenter.presentQuestionnaireInstances(result);
      })
      .catch((err) => {
        console.log('Could not get questionnaire instances from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function getAllForUser(request) {
    const user_id = request.params.user_id;

    return questionnaireInstancesInteractor
      .getQuestionnaireInstancesForUser(request.auth.credentials, user_id)
      .then(function (result) {
        return RESTPresenter.presentQuestionnaireInstances(result);
      })
      .catch((err) => {
        console.log('Could not get questionnaire instances from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function update(request) {
    const id = request.params.id;
    const status = request.payload.status;
    const progress = request.payload.progress;
    const release_version = request.payload.release_version;

    return questionnaireInstancesInteractor
      .updateQuestionnaireInstance(
        request.auth.credentials,
        id,
        status,
        progress,
        release_version
      )
      .then(function (result) {
        return RESTPresenter.presentQuestionnaireInstance(result);
      })
      .catch((err) => {
        console.log('Could not update questionnaire instance in DB: ' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description gets the questionnaire instance if the user has access
     * @memberof module:questionnaireInstancesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description get all questionnaire instances the user has access to
     * @memberof module:questionnaireInstancesHandler
     */
    getAll: getAll,

    /**
     * @function
     * @description gets the questionnaire instances fpr specified user if the requester has access
     * @memberof module:questionnaireInstancesHandler
     */
    getAllForUser: getAllForUser,

    /**
     * @function
     * @description updates the questionnaire instance if the user has access
     * @memberof module:questionnaireInstancesHandler
     */
    update: update,
  };
})();

module.exports = questionnaireInstancesHandler;
