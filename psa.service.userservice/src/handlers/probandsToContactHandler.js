/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const probandsToContactInteractor = require('../interactors/probandsToContactInteractor');

/**
 * @description HAPI Handler for planned probands
 */
const probandsToContactHandler = (function () {
  async function getProbandsToContact(request) {
    return probandsToContactInteractor
      .getProbandsToContact(request.auth.credentials)
      .catch((err) => {
        console.log('Could not get users from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  async function updateOne(request) {
    const id = request.params.id;
    await probandsToContactInteractor
      .updateProbandsToContact(request.auth.credentials, id, request.payload)
      .catch((err) => {
        console.log('Could update probands to contact in DB: ' + err);
        return Boom.notFound(err);
      });
    return null;
  }

  return {
    /**
     * @function
     * @description get all probands that need to be contacted
     * @memberof module:probandsToContactHandler
     */
    getProbandsToContact: getProbandsToContact,

    /**
     * @function
     * @description updates the probands to contact
     * @memberof module:probandsToContactHandler
     */
    updateOne: updateOne,
  };
})();

module.exports = probandsToContactHandler;
