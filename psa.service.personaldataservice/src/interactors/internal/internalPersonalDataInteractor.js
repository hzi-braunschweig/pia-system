const personalDataService = require('../../services/personalDataService');
const userserviceClient = require('../../clients/userserviceClient');

class InternalPersonalDataInteractor {
  /**
   * Creates or updates the personal data if the proband exists and is not deactivated
   *
   * @param {string} pseudonym the user the personal data belong to
   * @param {PersonalDataReq} personalData the personal data to change
   * @returns {Promise<PersonalData>}
   */
  static async createOrUpdate(pseudonym, personalData) {
    const primaryStudy = await userserviceClient.getPrimaryStudy(pseudonym);
    return personalDataService.createOrUpdate(
      pseudonym,
      primaryStudy.name,
      personalData
    );
  }

  /**
   * Delete the personal data of a proband
   *
   * @param {string} username the user the personal data belong to
   * @returns {Promise<void>}
   */
  static async deletePersonalData(username) {
    return personalDataService.deletePersonalData(username);
  }

  /**
   * Gets the email from the personal data of the given proband
   * @param username
   * @return {Promise<string>}
   */
  static async getPersonalDataEmail(username) {
    return personalDataService.getPersonalDataEmail(username);
  }
}

module.exports = InternalPersonalDataInteractor;
