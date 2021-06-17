const postgresqlHelper = require('../services/postgresqlHelper.js');
const pendingDeletionsInteractor = require('../interactors/pendingDeletionsInteractor.js');

/**
 * @description HAPI Handler for pending deletions
 */
const pendingDeletionsHandler = (function () {
  function getOne(request) {
    const id = request.params.id;

    return pendingDeletionsInteractor.getPendingDeletion(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function getOneForProbandId(request) {
    const proband_id = request.params.proband_id;

    return pendingDeletionsInteractor.getPendingDeletionForProbandId(
      request.auth.credentials,
      proband_id,
      postgresqlHelper
    );
  }

  function getOneForSampleId(request) {
    const sample_id = request.params.sample_id;

    return pendingDeletionsInteractor.getPendingDeletionForSampleId(
      request.auth.credentials,
      sample_id,
      postgresqlHelper
    );
  }

  function getOneForStudyId(request) {
    const study_id = request.params.study_id;

    return pendingDeletionsInteractor.getPendingDeletionForStudyId(
      request.auth.credentials,
      study_id,
      postgresqlHelper
    );
  }

  function createOne(request) {
    return pendingDeletionsInteractor.createPendingDeletion(
      request.auth.credentials,
      request.payload,
      postgresqlHelper
    );
  }

  function updateOne(request) {
    const id = request.params.id;

    return pendingDeletionsInteractor.updatePendingDeletion(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function deleteOne(request) {
    const id = request.params.id;

    return pendingDeletionsInteractor.cancelPendingDeletion(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  return {
    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description gets the pending deletion for proband_id
     * @memberof module:pendingDeletionsHandler
     */
    getOneForProbandId: getOneForProbandId,

    /**
     * @function
     * @description gets the pending deletion for sample_id
     * @memberof module:pendingDeletionsHandler
     */
    getOneForSampleId: getOneForSampleId,

    /**
     * @function
     * @description gets the pending deletion for study_id
     * @memberof module:pendingDeletionsHandler
     */
    getOneForStudyId: getOneForStudyId,

    /**
     * @function
     * @description creates the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description deletes the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = pendingDeletionsHandler;
