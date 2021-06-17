const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');

/**
 * @description HAPI Handler for answertypes
 */
const answertypesHandler = (function () {
  function getOne(request) {
    const id = request.params.id;

    return postgresqlHelper
      .getAnswertype(id)
      .then(function (result) {
        return RESTPresenter.presentAnswertype(result);
      })
      .catch((err) => {
        console.log('Could not get answertype from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function getAll() {
    return postgresqlHelper
      .getAnswertypes()
      .then(function (result) {
        return RESTPresenter.presentAnswertypes(result);
      })
      .catch((err) => {
        console.log('Could not get answertypes from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description gets the answertype
     * @memberof module:answertypesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description get all answertypes
     * @memberof module:answertypesHandler
     */
    getAll: getAll,
  };
})();

module.exports = answertypesHandler;
