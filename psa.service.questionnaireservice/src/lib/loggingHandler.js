/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pgHelper = require('../services/postgresqlHelper.js');
const fetch = require('node-fetch');
const { config } = require('../config');

const serviceUrl = config.services.loggingservice.url;

/**
 * @description Utility Handler for requests logging
 */
const LoggingHandler = (function () {
  async function handle(request) {
    const logMethod = getLogMethod(request);
    if (logMethod) {
      const username = retrieveUsernameFromRequest(request);
      const loggingEnabled = await checkLoggingActive(username);
      if (
        loggingEnabled &&
        request.response &&
        request.response.statusCode === 200
      ) {
        logMethod(
          request,
          request.auth.credentials,
          postLogActivityFn(request)
        );
      }
    }
  }

  function postLogActivityFn(request) {
    return function (activity) {
      postLog(retrieveUsernameFromRequest(request), {
        app: retrieveClientType(request),
        activity: activity,
      });
    };
  }

  function getLogMethod(request) {
    if (request.route && request.route.settings && request.route.settings.app) {
      return request.route.settings.app.log;
    }
  }

  function retrieveUsernameFromRequest(request) {
    try {
      if (request.payload && request.payload.username) {
        return request.payload.username;
      } else if (request.auth.credentials) {
        return request.auth.credentials.username;
      }
    } catch (e) {
      console.log('LoggingHandler: ', e);
      return null;
    }
  }

  function retrieveClientType(request) {
    let usedApp = 'n.a';
    if (request.auth.credentials) {
      usedApp = request.auth.credentials.app;
    }
    return usedApp;
  }

  function postLog(username, logObj) {
    logObj.timestamp = new Date().toISOString();
    fetch(`${serviceUrl}/log/logs/${username}`, {
      method: 'post',
      body: JSON.stringify(logObj),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(console.log(`Logging event was sent for user ${username}`))
      .catch((err) => console.error(err));
  }

  async function checkLoggingActive(username) {
    try {
      const user = await pgHelper.getUser(username);
      return user && user.role === 'Proband' && !!user.logging_active;
    } catch (e) {
      return false;
    }
  }

  return {
    /**
     * Handles the logging case for a request
     * @param {Object} request object
     */
    handle: handle,
  };
})();

module.exports = LoggingHandler;
