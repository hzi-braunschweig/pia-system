const Boom = require('@hapi/boom');
const { UniqueConstraintError } = require('sequelize');
const compliancePlaceholderRepository = require('../repositories/compliancePlaceholderRepository');

class CompliancePlaceholderInteractor {
  /**
   * Gets the questionnaire-placeholder of a specific study
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study the name of the study
   * @returns {Array} the questionnaire-placeholder of a specific study
   */
  static async getComplianceQuestionnairePlaceholders(request, study) {
    try {
      const questionnairePlaceholders =
        await compliancePlaceholderRepository.getComplianceQuestionnairePlaceholders(
          study
        );
      return questionnairePlaceholders.map((item) => ({
        type: item.type,
        placeholder: item.placeholder,
        label: item.label,
      }));
    } catch (e) {
      request.log('error', e);
      throw e;
    }
  }

  /**
   * Creates questionnaire-placeholder for a specific study
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study the name of the study
   * @param {string} genericFieldDescription the placeholder
   * @returns {Array} the questionnaire-placeholder of a specific study
   */
  static async createNewComplianceQuestionnairePlaceholder(
    request,
    study,
    genericFieldDescription
  ) {
    try {
      await compliancePlaceholderRepository.createNewComplianceQuestionnairePlaceholder(
        study,
        genericFieldDescription
      );
      return CompliancePlaceholderInteractor.getComplianceQuestionnairePlaceholders(
        request,
        study
      );
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        return Boom.badData('The placeholder already exists.');
      } else {
        request.log('error', e);
        throw e;
      }
    }
  }
}

module.exports = CompliancePlaceholderInteractor;
