/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { ComplianceText } = require('../db');
const transactionWrapper = require('../lib/transactionWrapper');

class ComplianceTextRepository {
  /**
   * Gets the compliance text for a specific study
   * @param {string} study the name of the study
   * @param {IOptions} options
   * @returns {Promise} a resolved promise with the requested compliance text
   */
  static async getComplianceText(study, options) {
    return ComplianceText.findOne({
      where: { study: study },
      transaction: transactionWrapper.getSqTransactionFromOptions(options),
    });
  }

  /**
   * Updates the compliance text of a specific study
   * @param {string} study the name of the study
   * @param {string} text the text to update
   * @param {string} to_be_filled_by the role by which the consent should be filled
   * @param {IOptions} options
   * @returns {Promise} a resolved <null>promise
   */
  static async updateComplianceText(study, text, to_be_filled_by, options) {
    let complianceText = await ComplianceText.findOne({
      where: { study: study },
      transaction: transactionWrapper.getSqTransactionFromOptions(options),
    });
    if (!complianceText) {
      complianceText = ComplianceText.build({ study });
    }
    complianceText.text = text;
    complianceText.to_be_filled_by = to_be_filled_by;
    await complianceText.save({
      transaction: transactionWrapper.getSqTransactionFromOptions(options),
    });
  }
}

module.exports = ComplianceTextRepository;
