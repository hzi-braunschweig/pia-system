const Boom = require('@hapi/boom');

const userLogRepository = require('../repositories/userLogRepository');
const userserviceClient = require('../clients/userserviceClient');

class UserLogInteractor {
  /**
   * Gets the logs for a user
   * @param {DecodedToken} decodedToken
   * @param {UserLogFilter} filter
   * @return {Promise<UserLogRes[]>}
   */
  static async getLogsFor(decodedToken, filter) {
    if (decodedToken.role === 'Forscher') {
      const probands = await this._getProbandsFromTheSameStudieAsForscher(
        filter.probands,
        decodedToken.username
      );

      if (probands.length > 0) {
        return (await userLogRepository.getLogsFor(probands, filter)) || [];
      }
      return [];
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  /**
   * @private
   * @param {string[]} probands
   * @param {string } forscher_id
   * @return {Promise<string[]>}
   */
  static async _getProbandsFromTheSameStudieAsForscher(probands, forscher_id) {
    const allProbands =
      await userserviceClient.getProbandsWithAcessToFromProfessional(
        forscher_id
      );
    if (!probands || probands.length === 0) {
      return allProbands;
    } else {
      return probands.filter((proband) =>
        allProbands.some((prob) => prob === proband)
      );
    }
  }
}

module.exports = UserLogInteractor;
