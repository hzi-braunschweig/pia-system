/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fileInteractor = require('../interactors/fileInteractor');

/**
 * @description HAPI Handler for answers
 */
const fileHandler = (function () {
  function getFileById(request) {
    const fileId = request.params.id;
    return fileInteractor.getFileById(fileId, request.auth.credentials);
  }

  return {
    /**
     * @description get one image as base64 coded
     */
    getFileById: getFileById,
  };
})();

module.exports = fileHandler;
