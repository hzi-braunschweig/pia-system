const Boom = require('@hapi/boom');
const tokenService = require('../services/tokenService.js');
const jwtService = require('../services/jwtService');

/**
 * @description HAPI Handler for login
 */
const connectSormasHandler = (function () {
  async function connectSormas(request, h) {
    const isValid = await tokenService.isValid(request.payload.token);

    if (!isValid) {
      return Boom.forbidden('Submitted auth token is invalid');
    }

    const jwt = await jwtService.createSormasToken();

    const user = {
      logged_in_with: 'web',
      pw_change_needed: false,
      role: 'ProbandenManager',
      token: jwt,
      token_login: jwt,
      username: 'sormas-client',
    };

    const sormasProband = {
      uuid: request.payload.uuid,
      email: request.payload.email,
      firstname: request.payload.firstname,
      lastname: request.payload.lastname,
    };

    return h.view('sormas-script.ejs', {
      data: {
        user: user,
        sormasProband: sormasProband,
      },
    });
  }

  return {
    /**
     * @function
     * @description handles request for one-time-token
     * @memberof module:requestToken
     */
    connectSormas: connectSormas,
  };
})();

module.exports = connectSormasHandler;
