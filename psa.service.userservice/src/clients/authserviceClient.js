const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.authservice.url;

class AuthserviceClient {
  static async createUser(user) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/auth/user`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'authserviceClient createUser: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'authserviceClient createUser: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }

  static async updateUser(user) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/auth/user`, {
        method: 'patch',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'authserviceClient updateUser: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'authserviceClient updateUser: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }
}

module.exports = AuthserviceClient;
