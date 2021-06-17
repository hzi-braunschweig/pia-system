const { ComplianceQuestionnairePlaceholder } = require('../db');
const transactionWrapper = require('../lib/transactionWrapper');

class CompliancePlaceholderRepository {
  /**
   * Gets the questionnaire-placeholders of a specific study
   * @param {string} study the name of the study
   * @param {IOptions} options
   * @returns {Promise} a resolved <array>promise with all questionnaire-placeholder of the requested study
   */
  static async getComplianceQuestionnairePlaceholders(study, options) {
    return ComplianceQuestionnairePlaceholder.findAll({
      where: { study: study },
      transaction: transactionWrapper.getSqTransactionFromOptions(options),
    });
  }

  /**
   * Creates a placeholder for a specific study
   * @param {string} study the name of the study
   * @param {string} genericFieldDescription the placeholder
   * @param {IOptions} options
   * @returns {Promise} a resolved <null>promise
   */
  static async createNewComplianceQuestionnairePlaceholder(
    study,
    genericFieldDescription,
    options
  ) {
    await ComplianceQuestionnairePlaceholder.create(
      {
        study,
        ...genericFieldDescription,
      },
      { transaction: transactionWrapper.getSqTransactionFromOptions(options) }
    );
  }
}

module.exports = CompliancePlaceholderRepository;
