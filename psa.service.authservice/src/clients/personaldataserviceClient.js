const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.personaldataservice.url;

class PersonaldataserviceClient {
  /**
   * Deletes the personal data of the proband based on the given username
   * @param {string} username
   * @return {Promise<string>}
   * @throws {Boom.Boom}
   */
  static async getPersonalDataEmail(username) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/personal/personalData/proband/${username}/email`,
        {
          method: 'get',
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'personalDataserviceClient getPersonalDataEmail: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'personalDataserviceClient getPersonalDataEmail: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.text();
  }
}

module.exports = PersonaldataserviceClient;
