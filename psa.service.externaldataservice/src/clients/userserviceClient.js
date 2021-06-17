const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.userservice.url;

class UserserviceClient {
  /**
   * Gets all pseudonyms from pia that are in a specific study or have a specific status account
   * @param {string} study
   * @param {string|string[]} accountStatus
   * @return {Promise<string[]>}
   */
  static async getPseudonyms(study, accountStatus) {
    const query = new URLSearchParams();
    if (study) {
      query.append('study', study);
    }
    if (typeof accountStatus === 'string') {
      query.append('accountStatus', accountStatus);
    } else if (Array.isArray(accountStatus)) {
      accountStatus.forEach((status) => query.append('accountStatus', status));
    }
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/user/pseudonyms?` + query, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getPseudonyms: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getPseudonyms: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.json();
  }
}

module.exports = UserserviceClient;
