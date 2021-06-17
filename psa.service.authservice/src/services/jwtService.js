const JWT = require('jsonwebtoken');

const pgHelper = require('./postgresqlHelper');
const { config } = require('../config');

const TOKEN_AUTH_TTL_PROBANDS = '24h';
const TOKEN_AUTH_TTL_PROFESSIONALS = '10h';
const TOKEN_LOGIN_TTL = '182d';

const jwtService = {
  sign: function (session, expiresIn) {
    const options = {
      algorithm: 'RS512',
      expiresIn,
    };

    return JWT.sign(session, config.privateAuthKey, options);
  },

  createAccessToken: async function ({ locale, app, role, username }) {
    const expiresIn =
      role === 'Proband'
        ? TOKEN_AUTH_TTL_PROBANDS
        : TOKEN_AUTH_TTL_PROFESSIONALS;

    const session = {
      id: 1,
      role,
      username,
      groups: await pgHelper.getUserStudies(username),

      locale,
      app,
    };

    return jwtService.sign(session, expiresIn);
  },

  createLoginToken: function ({ username }) {
    const session = {
      id: 2,
      username,
    };

    return jwtService.sign(session, TOKEN_LOGIN_TTL);
  },

  createSormasToken: async function () {
    const username = 'sormas-client';
    const role = 'ProbandenManager';

    const session = {
      id: 1,
      role,
      username,
      groups: await pgHelper.getUserStudies(username),
    };

    return jwtService.sign(session, TOKEN_AUTH_TTL_PROFESSIONALS);
  },
};

module.exports = jwtService;
