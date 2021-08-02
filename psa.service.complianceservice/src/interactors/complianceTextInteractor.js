/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const complianceTextRepository = require('../repositories/complianceTextRepository');
const complianceService = require('../services/complianceService');
const textSegmentationPipe = require('../services/textSegmentationPipe');

class ComplianceTextInteractor {
  /**
   * Reads the compliance text of a specific study so a user can agree to it
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study the name of the study
   * @param role {string} the role of the requester
   * @returns {Object} the compliance text of a specific study
   */
  static async getComplianceTextForAgree(request, study, role) {
    try {
      const complianceText = await complianceTextRepository.getComplianceText(
        study
      );
      if (!complianceText) {
        return null;
      }
      if (complianceText.to_be_filled_by === role) {
        return {
          compliance_text: complianceText.text,
          compliance_text_object: await textSegmentationPipe.segment(
            complianceText.text
          ),
        };
      } else {
        return null;
      }
    } catch (e) {
      request.log('error', e);
      throw e;
    }
  }

  /**
   * Reads the compliance text of a specific study so a user can edit it
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study the name of the study
   * @returns {Object} the compliance text of a specific study
   */
  static async getComplianceTextForEdit(request, study) {
    try {
      const complianceText = await complianceTextRepository.getComplianceText(
        study
      );
      if (!complianceText) {
        return null;
      }
      return {
        compliance_text: complianceText.text,
        to_be_filled_by: complianceText.to_be_filled_by,
      };
    } catch (e) {
      request.log('error', e);
      throw e;
    }
  }

  /**
   * Updates the compliance text of a specific study
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study the name of the study
   * @param {{compliance_text:string,to_be_filled_by:string}} complianceTextObject the text to update
   * @returns {Object} the updated compliance text
   */
  static async updateComplianceText(request, study, complianceTextObject) {
    try {
      await complianceTextRepository.updateComplianceText(
        study,
        complianceTextObject.compliance_text,
        complianceTextObject.to_be_filled_by
      );
      return await ComplianceTextInteractor.getComplianceTextForEdit(
        request,
        study
      );
    } catch (e) {
      request.log('error', e);
      throw e;
    }
  }

  /**
   * Converts a compliance text into a segmented object
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} complianceText the text to update
   * @returns {import('@pia/lib-templatepipeline').TemplateSegment[]} the converted compliance text as a segmented document
   */
  static async previewComplianceText(request, complianceText) {
    try {
      return textSegmentationPipe.segment(complianceText);
    } catch (e) {
      request.log('error', e);
      throw e;
    }
  }

  /**
   * Returns a boolean, whether the internal compliance is active
   * @param {import('@hapi/hapi').Request} request the request
   * @param {string} study the text to update
   * @returns {Promise<boolean>} the converted compliance text as a segmented document
   */
  static async isInternalComplianceActive(request, study) {
    return complianceService.isInternalComplianceActive(study);
  }
}

module.exports = ComplianceTextInteractor;
