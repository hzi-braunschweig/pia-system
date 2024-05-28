/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const textSegmentationPipe = require('./textSegmentationPipe');

class ComplianceMapper {
  /**
   * Converts an internalCompliance into a ComplianceI object for the API
   * @param {Compliance} complianceAgree
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

  /**
   * Converts an internalCompliance into a ComplianceI object for the API
   * @param {Compliance} complianceAgree
   * @return {Promise<ComplianceRes>}
   */
  static async mapComplianceForExport(complianceAgree) {
    const complianceQuestionnaire =
      await this._getMergedQuestionnaireCompliances(complianceAgree);

    const customFields = complianceQuestionnaire.reduce(
      (resultingObject, customField) => {
        resultingObject[customField.name] = customField.value;
        return resultingObject;
      },
      {}
    );

    return {
      ...customFields,
      pseudonym: complianceAgree.username,
      timestamp: complianceAgree.timestamp,
      ids: complianceAgree.ids,
      firstname: complianceAgree.firstname,
      lastname: complianceAgree.lastname,
      birthdate: complianceAgree.birthdate,
      address: complianceAgree.location,
      complianceApp: complianceAgree.complianceApp,
      complianceSamples: complianceAgree.complianceSamples,
      complianceBloodsamples: complianceAgree.complianceBloodsamples,
      complianceLabresults: complianceAgree.complianceLabresults,
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
   * @param {{complianceSamples:boolean, complianceBloodsamples: boolean, complianceLabresults: boolean}} externalCompliance
   * @return {Promise<ComplianceRes>}
   */
  static async mapExternalCompliance(externalCompliance) {
    return {
      timestamp: null,
      compliance_text: '',
      compliance_text_object: [],
      textfields: {},
      compliance_system: {
        app: true,
        samples: externalCompliance.complianceSamples,
        bloodsamples: externalCompliance.complianceBloodsamples,
        labresults: externalCompliance.complianceLabresults,
      },
      compliance_questionnaire: [],
    };
  }

  /**
   * Converts a compliance object into a ComplianceI object for the API
   * @param {object} compliance
   * @return {Promise<ComplianceRes>}
   */
  static async mapComplianceForComplianceManager(compliance) {
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
