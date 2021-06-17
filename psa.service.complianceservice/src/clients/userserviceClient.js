const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.userservice.url;

class UserserviceClient {
  /**
   * Look up a user's ids
   *
   * @param {string} username
   */
  static async lookupIds(username) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/user/users/${username}/ids`, {
        method: 'get',
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        `userserviceClient lookupIds: ${username}: Did not receive a response`,
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient lookupIds: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.text();
  }

  /**
   * Look up a user's mappingId
   *
   * @param {string} username
   */
  static async lookupMappingId(username) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/user/users/${username}/mappingId`,
        {
          method: 'get',
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        `userserviceClient lookupMappingId: ${username}: Did not receive a response`,
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient lookupMappingId: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.text();
  }

  /**
   * Retrieves the user's external compliance
   *
   * @param {string} username
   * @return {Promise} resolving an object containing the compliance data
   */
  static async retrieveUserExternalCompliance(username) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/user/users/${username}/externalcompliance`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient retrieveUserExternalCompliance: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient retrieveUserExternalCompliance: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }
}

module.exports = UserserviceClient;
