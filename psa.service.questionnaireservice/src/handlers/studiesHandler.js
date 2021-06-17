const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const studiesInteractor = require('../interactors/studiesInteractor.js');

/**
 * @description HAPI Handler for studies
 */
const studiesHandler = (function () {
  function getOne(request) {
    const name = request.params.name;

    return studiesInteractor
      .getStudy(request.auth.credentials, name, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentStudy(result);
      })
      .catch((err) => {
        console.log('Could not get study from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function getAll(request) {
    return studiesInteractor
      .getStudies(request.auth.credentials, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentStudies(result);
      })
      .catch((err) => {
        console.log('Could not get studies from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function getAllStudiesOfProband(request) {
    const proband = request.params.username;

    return studiesInteractor
      .getStudiesOfProband(request.auth.credentials, proband, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentStudies(result);
      })
      .catch((err) => {
        console.log('Could not get studies from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function createOne(request) {
    const study = request.payload;

    return studiesInteractor
      .createStudy(request.auth.credentials, study, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentStudy(result);
      })
      .catch((err) => {
        console.log('Could not create study in DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function updateOne(request) {
    const name = request.params.name;
    const study = request.payload;

    return studiesInteractor
      .updateStudy(request.auth.credentials, name, study, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentStudy(result);
      })
      .catch((err) => {
        console.log('Could not update study in DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function updateStudyWelcomeText(request) {
    const studyName = request.params.name;
    const welcomeText = request.payload.welcome_text;
    return studiesInteractor
      .updateStudyWelcomeText(
        request.auth.credentials,
        studyName,
        welcomeText,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentStudyWelcomeText(result);
      });
  }

  function getStudyWelcomeText(request) {
    const studyName = request.params.name;
    return studiesInteractor
      .getStudyWelcomeText(
        request.auth.credentials,
        studyName,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentStudyWelcomeText(result);
      });
  }

  function getStudyAddresses(request) {
    return studiesInteractor
      .getStudyAddresses(request.auth.credentials, postgresqlHelper)
      .then(function (result) {
        return result;
      })
      .catch((err) => {
        console.log('Could not get study addresses from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description gets the study if the user has access
     * @memberof module:studiesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description get all studies the user has access to
     * @memberof module:studiesHandler
     */
    getAll: getAll,

    /**
     * @function
     * @description gets all studies the user has access to that are assigned to the given proband
     * @memberof module:studiesHandler
     */
    getAllStudiesOfProband: getAllStudiesOfProband,

    /**
     * @function
     * @description creates the study if the user has access
     * @memberof module:studiesHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the study if the user has access
     * @memberof module:studiesHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description updates the study welcome text if the user has access
     * @memberof module:studiesHandler
     */
    updateStudyWelcomeText: updateStudyWelcomeText,

    /**
     * @function
     * @description gets the study welcome text if the user has access
     * @memberof module:studiesHandler
     */
    getStudyWelcomeText: getStudyWelcomeText,

    /**
     * @function
     * @description gets the study access if the user has access
     * @memberof module:studiesHandler
     */
    getStudyAddresses: getStudyAddresses,
  };
})();

module.exports = studiesHandler;
