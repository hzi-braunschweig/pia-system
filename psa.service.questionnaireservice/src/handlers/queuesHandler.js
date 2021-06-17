const Boom = require('@hapi/boom');
const RESTPresenter = require('../services/RESTPresenter.js');
const queuesInteractor = require('../interactors/queuesInteractor.js');

/**
 * @description HAPI Handler for instance queues
 */
const queuesHandler = (function () {
  function getAll(request) {
    const user_id = request.params.user_id;

    return queuesInteractor
      .getAllQueues(request.auth.credentials, user_id)
      .then(function (result) {
        return RESTPresenter.presentAllQueues(result, user_id);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  function deleteOne(request) {
    const user_id = request.params.user_id;
    const instance_id = request.params.instance_id;

    return queuesInteractor
      .deleteOneQueue(request.auth.credentials, user_id, instance_id)
      .then(function (result) {
        return RESTPresenter.presentQueue(result, user_id, instance_id);
      })
      .catch((err) => {
        return Boom.forbidden(err);
      });
  }

  return {
    /**
     * @function
     * @description gets the instances queues for a proband
     * @memberof module:queuesHandler
     */
    getAll: getAll,

    /**
     * @function
     * @description deletes the queued instance
     * @memberof module:queuesHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = queuesHandler;
