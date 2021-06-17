const handleError = require('../../handleError');

const internalPersonalDataInteractor = require('../../interactors/internal/internalPersonalDataInteractor');

class InternalPersonalDataHandler {
  /**
   * Updates or creates a personal data entry
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<PersonalData>}
   */
  static async createOrUpdate(request) {
    return internalPersonalDataInteractor
      .createOrUpdate(request.params.pseudonym, request.payload)
      .catch((err) =>
        handleError(request, 'Could not update user values in DB:', err)
      );
  }

  /**
   * Deletes the personal data of a proband
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<PersonalData>}
   */
  static async deleteOne(request) {
    return internalPersonalDataInteractor
      .deletePersonalData(request.params.username)
      .then(() => null)
      .catch((err) =>
        handleError(request, 'Could not delete personal data in DB:', err)
      );
  }

  /**
   * Gets the email from the personal data of the given proband
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<string>}
   */
  static async getEmail(request) {
    return internalPersonalDataInteractor
      .getPersonalDataEmail(request.params.username)
      .catch((err) => handleError(request, 'Could get email:', err));
  }
}

module.exports = InternalPersonalDataHandler;
