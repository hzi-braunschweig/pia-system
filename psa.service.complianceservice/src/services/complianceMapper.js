/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const textSegmentationPipe = require('./textSegmentationPipe');

class ComplianceMapper {
  /**
   * Converts an internalCompliance into a ComplianceI object for the API
   * @param complianceAgree {Compliance}
   * @return {Promise<ComplianceRes>}
   */
  static async mapInternalCompliance(complianceAgree) {
    return {
      timestamp: complianceAgree.timestamp,
      compliance_text: complianceAgree.complianceText,
      compliance_text_object: await textSegmentationPipe.segment(
        complianceAgree.complianceText
      ),
      textfields: {
        firstname: complianceAgree.firstname,
        lastname: complianceAgree.lastname,
        location: complianceAgree.location,
        birthdate: complianceAgree.birthdate,
      },
      compliance_system: {
        app: complianceAgree.complianceApp,
        samples: complianceAgree.complianceSamples,
        bloodsamples: complianceAgree.complianceBloodsamples,
        labresults: complianceAgree.complianceLabresults,
      },
      compliance_questionnaire: await this._getMergedQuestionnaireCompliances(
        complianceAgree
      ),
    };
  }

  static async _getMergedQuestionnaireCompliances(complianceAgree) {
    return (
      await Promise.all([
        complianceAgree.getQuestionnaireCompliances(),
        complianceAgree.getQuestionnaireTextCompliances(),
      ])
    )
      .flat()
      .map((item) => ({ name: item.placeholder, value: item.value }));
  }

  /**
   * Converts an externalCompliance into a ComplianceI object for the API
   * @param externalCompliance {{compliance_samples:boolean, compliance_bloodsamples: boolean, compliance_labresults: boolean}}
   * @return {Promise<ComplianceRes>}
   */
  static mapExternalCompliance(externalCompliance) {
    return {
      timestamp: null,
      compliance_text: '',
      compliance_text_object: [],
      textfields: {},
      compliance_system: {
        app: true,
        samples: externalCompliance.compliance_samples,
        bloodsamples: externalCompliance.compliance_bloodsamples,
        labresults: externalCompliance.compliance_labresults,
      },
      compliance_questionnaire: [],
    };
  }

  /**
   * Converts a compliance object into a ComplianceI object for the API
   * @param compliance object
   * @return {Promise<ComplianceRes>}
   */
  static mapComplianceForComplianceManager(compliance) {
    return {
      id: compliance.id,
      study: compliance.study,
      username: compliance.username,
      ids: compliance.ids,
      firstname: compliance.firstname,
      lastname: compliance.lastname,
      birthdate: compliance.birthdate,
    };
  }
}

module.exports = ComplianceMapper;
