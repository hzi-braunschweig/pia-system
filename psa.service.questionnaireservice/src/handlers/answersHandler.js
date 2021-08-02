/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { RESTPresenter } = require('../services/RESTPresenter');
const answersInteractor = require('../interactors/answersInteractor.js');

/**
 * @description HAPI Handler for answers
 */
const answersHandler = (function () {
  function createOrUpdate(request) {
    const qInstanceId = request.params.id;
    const answers = request.payload.answers;
    const version = request.payload.version;
    const date_of_release = request.payload.date_of_release
      ? request.payload.date_of_release
      : null;

    return answersInteractor
      .createOrUpdateAnswers(
        request.auth.credentials,
        qInstanceId,
        answers,
        version,
        date_of_release
      )
      .then(function (result) {
        return RESTPresenter.presentAnswers(result, qInstanceId);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function get(request) {
    const qInstanceId = request.params.id;

    return answersInteractor
      .getAnswers(request.auth.credentials, qInstanceId)
      .then(function (result) {
        return RESTPresenter.presentAnswers(result, qInstanceId);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function getHistorical(request) {
    const qInstanceId = request.params.id;

    return answersInteractor
      .getAnswersHistorical(request.auth.credentials, qInstanceId)
      .then(function (result) {
        return RESTPresenter.presentAnswers(result, qInstanceId);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function deleteOne(request) {
    const qInstanceId = request.params.id;
    const answerOptionId = request.params.answer_option_id;

    return answersInteractor
      .deleteAnswer(request.auth.credentials, qInstanceId, answerOptionId)
      .then(() => null)
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  return {
    /**
     * @function
     * @description ucreates or updates answers for a questionnaire instance
     * @memberof module:answersHandler
     */
    createOrUpdate: createOrUpdate,

    /**
     * @function
     * @description gets the answers for a questionnaire instance
     * @memberof module:answersHandler
     */
    get: get,

    /**
     * @function
     * @description gets the historical answers for a questionnaire instance
     * @memberof module:answersHandler
     */
    getHistorical: getHistorical,

    /**
     * @function
     * @description deletes the answer for an answer option
     * @memberof module:answersHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = answersHandler;
