/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const postgresqlHelper = require('../../services/postgresqlHelper');
const studyAccessRepository = require('../../repositories/studyAccessRepository');
const { config } = require('../../config');
const sormasserviceClient = require('../../clients/sormasserviceClient.js');
const loggingserviceClient = require('../../clients/loggingserviceClient.js');
const { runTransaction } = require('../../db');

/**
 * @description internal interactor that handles user requests
 */
const internalUsersInteractor = (function () {
  async function deleteProbandData(username, keepUsageData) {
    return await runTransaction(async (t) => {
      const result = await postgresqlHelper.deleteProbandData(
        username,
        keepUsageData,
        { transaction: t }
      );

      console.log('Checking if deletion must be reported to another system...');
      if (config.isSormasActive) {
        const ids = await postgresqlHelper
          .lookupUserIds(username, { transaction: t })
          .catch((err) => {
            throw Boom.notFound('Could not find the user', err);
          });
        if (!ids) {
          console.log('Not reporting to SORMAS: Could not find the users ids');
          throw Boom.notFound('Could not find the users ids');
        }
        console.log('Reporting to SORMAS.');
        await sormasserviceClient.setStatus(ids, 'DELETED');
      }

      if (!keepUsageData) {
        await loggingserviceClient.deleteLogs(username);
      }
      return result;
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err);
    });
  }

  async function lookupIds(username) {
    return postgresqlHelper.lookupUserIds(username);
  }

  async function lookupMappingId(username) {
    return postgresqlHelper.lookupMappingId(username);
  }

  async function getUserExternalCompliance(username) {
    return await postgresqlHelper.getUserExternalCompliance(username);
  }

  async function getPrimaryStudyOfProband(username) {
    return await postgresqlHelper.getPrimaryStudyOfProband(username);
  }

  async function getProbandsWithAcessToFromProfessional(username) {
    return studyAccessRepository.getProbandsWithAcessToFromProfessional(
      username
    );
  }

  async function getProband(username) {
    const proband = await postgresqlHelper.getUser(username);
    if (!proband) {
      throw Boom.notFound();
    }
    return proband;
  }

  async function getStudiesForProfessional(username) {
    return studyAccessRepository.getStudiesForProfessional(username);
  }

  async function getPseudonyms(study, accountStatus) {
    return postgresqlHelper.getPseudonyms(study, accountStatus);
  }

  return {
    /**
     * @function
     * @description deletes a user and all its data from DB
     * @memberof module:internalUsersInteractor
     * @param {string} username the username of the user to delete
     * @param {boolean} keepUsageData Will not delete questionnaire answers which are marked to keep its answers and log data if true
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deleteProbandData: deleteProbandData,

    /**
     * @function
     * @description gets the user IDS from DB
     * @memberof module:internalUsersInteractor
     * @param {string} username the username of the user
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    lookupIds: lookupIds,

    /**
     * @function
     * @description gets the user's MappingId from DB
     * @memberof module:internalUsersInteractor
     * @param {string} username the username of the user
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    lookupMappingId: lookupMappingId,

    /**
     * @function
     * @description gets the user external compliance from the DB
     * @memberof module:internalUsersInteractor
     * @param {string} username the username of the user
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getUserExternalCompliance: getUserExternalCompliance,

    /**
     * @function
     * @description gets the users primary study from the DB
     * @memberof module:internalUsersInteractor
     * @param {string} username the username of the user
     * @returns {Promise<{studyName: string}>} the name of the study
     */
    getPrimaryStudyOfProband: getPrimaryStudyOfProband,

    getProbandsWithAcessToFromProfessional:
      getProbandsWithAcessToFromProfessional,

    /**
     * @function
     * @description gets the proband by username
     * @memberof module:internalUsersInteractor
     * @param {string} username the username of the proband
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getProband: getProband,

    getStudiesForProfessional: getStudiesForProfessional,

    getPseudonyms: getPseudonyms,
  };
})();

module.exports = internalUsersInteractor;
