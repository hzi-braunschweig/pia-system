/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const probandsToContactInteractor = require('../interactors/probandsToContactInteractor');

/**
 * @description HAPI Handler for planned probands
 */
const probandsToContactHandler = (function () {
  function getProbandsToContact(request) {
    return probandsToContactInteractor
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
    return probandsToContactInteractor
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