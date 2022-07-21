/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const complianceRepository = require('../repositories/complianceRepository');
const complianceService = require('../services/complianceService');
const templatePipelineService = require('../services/pdfGeneratorService');
const { userserviceClient } = require('../clients/userserviceClient');
const transactionWrapper = require('../utils/transactionWrapper');
const complianceMapper = require('../services/complianceMapper');
const { messageQueueService } = require('../services/messageQueueService');

class ComplianceInteractor {
  /**
   * Gets the compliance of a user for a specific study
   * @param {import('@hapi/hapi').Request} request
   * @param {string} study the name of the study
   * @param {string} userId the name of the user
   * @return {Promise<import("../model/compliance").ComplianceRes> | Promise<undefined>} the requested compliance of a specific study
   */
  static async getComplianceAgree(request, study, userId) {
    return complianceService.getComplianceAgree(request, study, userId);
  }

  /**
   * Gets the compliance of a user for a specific study
   * @param {serial} complianceId the id of the compliance record
   * @param {string} study the study the user has access to
   * @return {Promise<import("../model/compliance").ComplianceRes>} the requested compliance of a specific study
   */
  static async getComplianceAgreeByComplianceId(complianceId, study) {
    const complianceAgree = await complianceRepository.getComplianceById(
      complianceId,
      study
    );

    if (!complianceAgree) {
      throw Boom.notFound('There is no compliance.');
    }

    return await complianceMapper.mapInternalCompliance(complianceAgree);
  }

  /**
   * Gets the compliances of a professional user by based on his study accesses
   * @param {import('@hapi/hapi').Request} request
   * @param {string[]} studies the studies the user has access to
   * @return {Promise<ComplianceReq>} the requested compliance of a specific study
   */
  static async getCompliancesForProfessional(request, studies) {
    try {
      return complianceService.getComplianceAgreementsForStudies(studies);
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }
  }

  /**
   * Gets the compliance of a user for a specific study as a PDF
   * @param {import('@hapi/hapi').Request} request
   * @param {string} study the name of the study
   * @param {string} userId the name of the user
   * @return {Promise<Buffer>} the requested compliance of a specific study as PDF
   */
  static async getComplianceAgreePdf(request, study, userId) {
    let complianceAgree;
    try {
      const mappingId = await userserviceClient.lookupMappingId(userId);
      complianceAgree = await complianceRepository.getComplianceOfUserForStudy(
        study,
        mappingId
      );
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }
    if (!complianceAgree) {
      throw Boom.notFound('There is no compliance.');
    }
    try {
      return await templatePipelineService.createPdf(
        request.plugins.i18n,
        complianceAgree
      );
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }
  }

  /**
   * Gets the compliance by its id as a PDF
   * @param {import('@hapi/hapi').Request} request
   * @param {number} complianceId the id of the compliance
   * @param {string} study the study the user has access to
   * @return {Promise<Buffer>} the requested compliance of a specific study as PDF
   */
  static async getComplianceAgreePdfByComplianceId(
    request,
    complianceId,
    study
  ) {
    let complianceAgree;
    try {
      complianceAgree = await complianceRepository.getComplianceById(
        complianceId,
        study
      );
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }

    if (!complianceAgree) {
      throw Boom.notFound('There is no compliance.');
    }

    try {
      return await templatePipelineService.createPdf(
        request.plugins.i18n,
        complianceAgree
      );
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }
  }

  /**
   * Creates the compliance of a user for a specific study
   * @param {import('@hapi/hapi').Request} request
   * @param {string} study the name of the study
   * @param {string} userId the name of the user
   * @param {ComplianceReq} compliance the new compliance for the specified study
   * @return {Promise<ComplianceRes>} the new compliance with the timestamp
   */
  static async createComplianceAgree(request, study, userId, compliance) {
    if (!compliance.compliance_system || !compliance.compliance_system.app) {
      throw Boom.badData('You must consent to the use of the app.');
    }
    const mappingId = await userserviceClient.lookupMappingId(userId);
    await transactionWrapper
      .run(async (t) => {
        if (
          !(await ComplianceInteractor._getComplianceAgreeNeededByMappingId(
            study,
            mappingId,
            { transaction: t }
          ))
        ) {
          throw Boom.conflict('It is not needed to consent.');
        }
        // check if ids and pseudonym need to be stored (only if there are no identifying data)
        let additionalData;
        if (
          !compliance.textfields ||
          (!compliance.textfields.firstname &&
            !compliance.textfields.lastname &&
            !compliance.textfields.birthdate)
        ) {
          additionalData = {
            username: userId,
            ids: await userserviceClient.lookupIds(userId),
          };
        }

        await complianceRepository.createCompliance(
          study,
          mappingId,
          compliance,
          additionalData,
          { transaction: t }
        );
        await messageQueueService.sendComplianceCreate(userId);
      })
      .catch((e) => {
        request.log('error', e.stack + JSON.stringify(e, null, 2));
        throw Boom.boomify(e);
      });
    // associations are not resolved in a transaction where they were created. Therefore: fetch after success
    return await complianceService.getComplianceAgree(
      request,
      study,
      userId,
      mappingId
    );
  }

  /**
   * Checks if a compliance is needed
   * @param {import('@hapi/hapi').Request} request
   * @param {string} study the name of the study
   * @param {string} userId the name of the user
   * @return {Promise<boolean>} true if a compliance is needed, false if everything is ok
   */
  static async getComplianceAgreeNeeded(request, study, userId) {
    try {
      const mappingId = await userserviceClient.lookupMappingId(userId);
      return await ComplianceInteractor._getComplianceAgreeNeededByMappingId(
        study,
        mappingId
      );
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }
  }

  /**
   * Checks if a compliance is needed
   * @param {string} study the name of the study
   * @param {string} mappingId the mapping ID of the user
   * @param {IOptions?} options
   * @return {Promise<boolean>} true if a compliance is needed, false if everything is ok
   * @private
   */
  static async _getComplianceAgreeNeededByMappingId(study, mappingId, options) {
    if (await complianceService.isInternalComplianceActive(study, options)) {
      const usersCompliance =
        await complianceRepository.getComplianceOfUserForStudy(
          study,
          mappingId,
          options
        );
      if (!usersCompliance || !usersCompliance.complianceApp) {
        return true;
      }
    }
    return false;
  }
}

module.exports = ComplianceInteractor;
