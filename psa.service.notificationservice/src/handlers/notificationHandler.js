/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');

const notificationInteractor = require('../interactors/notificationInteractor.js');

/**
 * @description HAPI Handler for fcm notifications
 */
const notificationHandler = (function () {
  async function postOne(request) {
    return notificationInteractor
      .createNotification(request.auth.credentials, request.payload)
      .catch((err) => {
        console.log('Could not send fcm notification:');
        console.log(err);
        return Boom.internal(err.message);
      });
  }

  async function getOne(request) {
    return notificationInteractor.getNotification(
      request.auth.credentials,
      request.params.id
    );
  }

  return {
    /**
     * @function
     * @description post the fcm notification
     * @memberof module:notificationHandler
     */
    postOne: postOne,

    /**
     * @function
     * @description get the notification
     * @memberof module:notificationHandler
     */
    getOne: getOne,
  };
})();

module.exports = notificationHandler;
