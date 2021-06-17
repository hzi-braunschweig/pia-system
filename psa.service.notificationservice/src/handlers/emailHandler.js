const emailInteractor = require('../interactors/emailInteractor.js');

/**
 * @description hapi handler for sending emails
 */
class EmailHandler {
  /**
   * Sends given payload to multiple probands' via mail
   * @param {import('@hapi/hapi').Request} request
   * @returns {Promise<Boom<Joi.ObjectSchema.unknown>|string[]>}
   */
  static sendEmail(request) {
    return emailInteractor.sendEmailToProbands(
      request.auth.credentials,
      request.payload
    );
  }
}

module.exports = EmailHandler;
