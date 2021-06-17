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
}

module.exports = PersonaldataserviceClient;
