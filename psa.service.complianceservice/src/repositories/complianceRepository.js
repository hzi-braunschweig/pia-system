/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const {
  Compliance,
  QuestionnaireCompliance,
  QuestionnaireTextCompliance,
} = require('../db');
const transactionWrapper = require('../utils/transactionWrapper');

class ComplianceRepository {
  /**
   * Gets the compliance data for the given proband
   * @param {string|string[]} study the name of the study or multiple studies as array
   * @param {string} mappingId technical mapping uuid, connecting the compliance to the user
   * @param {IOptions} options
   * @returns {Promise<Compliance>} a resolved promise with the compliance data or a rejected promise with the error
   */
  static async getComplianceOfUserForStudy(study, mappingId, options) {
    return Compliance.findOne({
      where: { study, mappingId },
      include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
      transaction: transactionWrapper.getSqTransactionFromOptions(options),
    });
  }

  /**
   * Gets the compliance data for the given proband
   * @param {serial} id
   * @param {string} study
   * @returns {Promise<Compliance>} a resolved promise with the compliance data or a rejected promise with the error
   */
  static async getComplianceById(id, study) {
    return Compliance.findOne({
      where: { id, study },
      attributes: { exclude: ['mappingId'] },
      include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
    });
  }

  /**
   * Gets the compliance data for the given study
   * @param {string|string[]} studies the name of the study or multiple studies as array
   * @returns {Promise<Compliance[]>} a resolved promise with the compliance data or a rejected promise with the error
   */
  static async getCompliancesForStudies(studies) {
    return Compliance.findAll({
      where: { study: studies },
      attributes: { exclude: ['mappingId', 'complianceText'] },
    });
  }

  /**
   *
   * @param {string} study
   * @param {string} mappingId technical mapping uuid, connecting the compliance to the user
   * @param {ComplianceReq} compliance
   * @param {{ [username]:string, [ids]:string }} additionalData
   * @param {IOptions} options
   * @return {Promise<void>}
   */
  static async createCompliance(
    study,
    mappingId,
    compliance,
    additionalData,
    options
  ) {
    const username =
      additionalData && additionalData.username
        ? additionalData.username
        : null;
    const ids =
      additionalData && additionalData.ids ? additionalData.ids : null;

    await Compliance.create(
      {
        mappingId: mappingId,
        study: study,
        complianceText: compliance.compliance_text,
        username: username,
        ids: ids,
        firstname: compliance.textfields && compliance.textfields.firstname,
        lastname: compliance.textfields && compliance.textfields.lastname,
        location: compliance.textfields && compliance.textfields.location,
        birthdate: compliance.textfields && compliance.textfields.birthdate,
        complianceApp:
          compliance.compliance_system && compliance.compliance_system.app,
        complianceBloodsamples:
          compliance.compliance_system &&
          compliance.compliance_system.bloodsamples,
        complianceLabresults:
          compliance.compliance_system &&
          compliance.compliance_system.labresults,
        complianceSamples:
          compliance.compliance_system && compliance.compliance_system.samples,
        QuestionnaireCompliances: compliance.compliance_questionnaire
          ? compliance.compliance_questionnaire
              .filter((item) => typeof item.value === 'boolean')
              .map((item) => ({ placeholder: item.name, value: item.value }))
          : [],
        QuestionnaireTextCompliances: compliance.compliance_questionnaire
          ? compliance.compliance_questionnaire
              .filter((item) => typeof item.value === 'string')
              .map((item) => ({ placeholder: item.name, value: item.value }))
          : [],
      },
      {
        include: [QuestionnaireCompliance, QuestionnaireTextCompliance],
        transaction: transactionWrapper.getSqTransactionFromOptions(options),
      }
    );
  }
}

module.exports = ComplianceRepository;
