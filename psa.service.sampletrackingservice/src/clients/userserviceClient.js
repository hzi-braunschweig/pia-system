const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.userservice.url;

class UserserviceClient {
  static async getPrimaryStudy(user_id) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/user/users/${user_id}/primaryStudy`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getPrimaryStudy: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getPrimaryStudy: received an Error',
        await res.text(),
        res.status
      );
    }

    return await res.json();
  }
}

module.exports = UserserviceClient;
