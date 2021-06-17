const Boom = require('@hapi/boom');
const pgHelper = require('../services/postgresqlHelper.js');

/**
 * @description HAPI Handler for logout
 */
const logoutHandler = (function () {
  async function logout(request) {
    try {
      const response = await pgHelper.updateUserOnLogout(
        request.payload.username
      );

      if (response && response.username === request.payload.username) {
        return {
          username: response.username,
          role: response.role,
          token: null,
        };
      } else {
        return Boom.forbidden(
          'The user does not exist or the password does not match'
        );
      }
    } catch (err) {
      console.log(err);
      return Boom.internal('Could not make request to db');
    }
  }

  return {
    /**
     * @function
     * @description logs a user in
     * @memberof module:logoutHandler
     */
    logout: logout,
  };
})();

module.exports = logoutHandler;
