const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.personaldataservice.url;

class PersonaldataserviceClient {
  /**
   * Updates the personal data for the proband with the given pseudonym
   * @param {string} pseudonym
   * @param {PersonalDataReq} data
   * @return {Promise}
   */
  static async updatePersonalData(pseudonym, data) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/personal/personalData/proband/${pseudonym}`,
        {
          method: 'put',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'personaldataserviceClient updatePersonalData: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'personaldataserviceClient updatePersonalData: received an Error',
        await res.text(),
        res.status
      );
    }
  }

  /**
   * Deletes the personal data of the proband based on the given username
   * @param {string} username
   * @return {Promise}
   */

  static async deletePersonalDataOfUser(username) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/personal/personalData/proband/${username}`,
        {
          method: 'delete',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'personalDataserviceClient deletePersonalData: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'personalDataserviceClient deletePersonalData: received an Error',
        await res.text(),
        res.status
      );
    }
  }
}

module.exports = PersonaldataserviceClient;
