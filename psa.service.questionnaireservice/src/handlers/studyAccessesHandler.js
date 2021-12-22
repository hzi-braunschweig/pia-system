/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { RESTPresenter } = require('../services/RESTPresenter');
const {
  StudyAccessesInteractor,
} = require('../interactors/studyAccessesInteractor');

/**
 * @description HAPI Handler for study accesses
 */
const studyAccessesHandler = (function () {
  function deleteOne(request) {
    const study_name = request.params.name;
    const username = request.params.username;

    return StudyAccessesInteractor.deleteStudyAccess(
      request.auth.credentials,
      study_name,
      username
    ).then(function (result) {
      return RESTPresenter.presentStudyAccess(result);
    });
  }

  function createOne(request) {
    const study_name = request.params.name;
    const study_access = request.payload;

    return StudyAccessesInteractor.createStudyAccess(
      request.auth.credentials,
      study_name,
      study_access
    ).then(function (result) {
      return RESTPresenter.presentStudyAccess(result);
    });
  }

  function updateOne(request) {
    const study_name = request.params.name;
    const username = request.params.username;
    const study_access = request.payload;

    return StudyAccessesInteractor.updateStudyAccess(
      request.auth.credentials,
      study_name,
      username,
      study_access
    ).then(function (result) {
      return RESTPresenter.presentStudyAccess(result);
    });
  }

  return {
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
