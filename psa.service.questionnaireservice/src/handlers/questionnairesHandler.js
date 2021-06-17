const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const questionnairesInteractor = require('../interactors/questionnairesInteractor.js');

/**
 * @description HAPI Handler for questionnaires
 */
const questionnairesHandler = (function () {
  function create(request) {
    const questionnaire = request.payload;

    return questionnairesInteractor
      .createQuestionnaire(
        request.auth.credentials,
        questionnaire,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentQuestionnaire(result);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function update(request) {
    const id = request.params.id;
    const version = request.params.version;
    const questionnaire = request.payload;

    return questionnairesInteractor
      .updateQuestionnaire(
        request.auth.credentials,
        id,
        version,
        questionnaire,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentQuestionnaire(result);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function revise(request) {
    const id = request.params.id;
    const questionnaire = request.payload;

    return questionnairesInteractor
      .reviseQuestionnaire(
        request.auth.credentials,
        id,
        questionnaire,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentQuestionnaire(result);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function getOne(request) {
    const id = request.params.id;
    const version = request.params.version;

    return questionnairesInteractor
      .getQuestionnaire(request.auth.credentials, id, version, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentQuestionnaire(result);
      })
      .catch((err) => {
        return Boom.notFound(err);
      });
  }

  function getAll(request) {
    return questionnairesInteractor
      .getQuestionnaires(request.auth.credentials, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentQuestionnaires(result);
      })
      .catch((err) => {
        return Boom.forbidden('Could not get questionnaires: ' + err);
      });
  }

  function deleteOne(request) {
    const id = request.params.id;
    const version = request.params.version;

    return questionnairesInteractor
      .deleteQuestionnaire(
        request.auth.credentials,
        id,
        version,
        postgresqlHelper
      )
      .then(function () {
        return JSON.stringify(
          'Successfully deleted questionnaire with id: ' + id
        );
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  return {
    /**
     * @function
     * @description creates a new questionnaire
     * @memberof module:questionnairesHandler
     */
    create: create,

    /**
     * @function
     * @description updates the questionnaire with the specified id
     * @memberof module:questionnairesHandler
     */
    update: update,

    /**
     * @function
     * @description revises the questionnaire from the specified id
     * @memberof module:questionnairesHandler
     */
    revise: revise,

    /**
     * @function
     * @description gets the questionnaire
     * @memberof module:questionnairesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description get all questionnaires the user has access to
     * @memberof module:questionnairesHandler
     */
    getAll: getAll,

    /**
     * @function
     * @description deletes the questionnaire
     * @memberof module:questionnairesHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = questionnairesHandler;
