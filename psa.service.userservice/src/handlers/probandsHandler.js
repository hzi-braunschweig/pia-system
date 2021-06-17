const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const probandsInteractor = require('../interactors/probandsInteractor.js');

/**
 * @description HAPI Handler for planned probands
 */
const probandsHandler = (function () {
  function getProbandsToContact(request) {
    return probandsInteractor
      .getProbandsToContact(request.auth.credentials, postgresqlHelper)
      .then(function (result) {
        return RESTPresenter.presentProbandsToContact(result);
      })
      .catch((err) => {
        console.log('Could not get users from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  function updateOne(request) {
    const id = request.params.id;
    return probandsInteractor
      .updateProbandsToContact(
        request.auth.credentials,
        id,
        request.payload,
        postgresqlHelper
      )
      .then(function (result) {
        return RESTPresenter.presentProbandsToContact(result);
      })
      .catch((err) => {
        console.log('Could update probands to contact in DB: ' + err);
        return Boom.notFound(err);
      });
  }

  return {
    /**
     * @function
     * @description get all probands that need to be contacted
     * @memberof module:probandsHandler
     */
    getProbandsToContact: getProbandsToContact,

    /**
     * @function
     * @description updates the probands to contact
     * @memberof module:probandsHandler
     */
    updateOne: updateOne,
  };
})();

module.exports = probandsHandler;
