/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const complianceTextRepository = require('../repositories/complianceTextRepository');
const complianceRepository = require('../repositories/complianceRepository');
const userserviceClient = require('../clients/userserviceClient');
const complianceMapper = require('../services/complianceMapper');

class ComplianceService {
  /**
   * Checks whether the internal compliance is active for a study, which currently means:
   * is there a compliance text, written by the researcher.
   * @param {string} study the study to be checked
   * @param {IOptions?} options
   * @return {Promise<boolean>} true if internal compliance is active ...
   */
  static async isInternalComplianceActive(study, options) {
    const complianceText = await complianceTextRepository.getComplianceText(
      study,
      options
    );
    return !!complianceText;
  }

  /**
   * Gets the compliance of a user for a study
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study
   * @param {string} userId
   * @param {string} mappingId
   * @param {IOptions} options
   * @return {Promise<ComplianceRes>}
   */
  static async getComplianceAgree(
    request,
    study,
    userId,
    mappingId = null,
    options
  ) {
    let agree;
    if (await this.isInternalComplianceActive(study)) {
      if (!mappingId) {
        mappingId = await userserviceClient.lookupMappingId(userId);
      }
      const complianceAgree =
        await complianceRepository.getComplianceOfUserForStudy(
          study,
          mappingId,
          options
        );
      if (complianceAgree) {
        agree = complianceMapper.mapInternalCompliance(complianceAgree);
      } else {
        agree = null;
      }
    } else {
      const externalCompliance =
        await userserviceClient.retrieveUserExternalCompliance(userId);
      agree = complianceMapper.mapExternalCompliance(externalCompliance);
    }
    return agree;
  }

  /**
   * Gets the compliance for a professional user based on the given studies array
   * @param {string[]} studies
   * @return {Promise<ComplianceRes[]>}
   */
  static async getComplianceAgreementsForStudies(studies) {
    const complianceAgreements =
      await complianceRepository.getCompliancesForStudies(studies);
    const complianceAgreementsArray = complianceAgreements.map(
      (complianceAgreement) =>
        complianceMapper.mapComplianceForComplianceManager(complianceAgreement)
    );
    return Promise.all(complianceAgreementsArray);
  }
}

module.exports = ComplianceService;
