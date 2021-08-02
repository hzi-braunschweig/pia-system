/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const pgHelper = require('../services/postgresqlHelper');
const {
  QuestionnaireInstanceRepository,
} = require('../repositories/questionnaireInstanceRepository');

/**
 * @description interactor that handles answers requests based on users permissions
 */
const fileInteractor = (function () {
  async function getFileById(id, decodedToken) {
    const userRole = decodedToken.role;
    const username = decodedToken.username;
    switch (userRole) {
      case 'Proband': {
        const file = await pgHelper.getFileBy(id).catch((err) => {
          console.log(err);
          throw Boom.badImplementation('Could not get image');
        });
        if (!file) throw Boom.notFound('File was not found');

        if (file.user_id !== username)
          throw Boom.forbidden('Wrong user for this command');

        return file;
      }
      case 'Untersuchungsteam': {
        const file = await pgHelper.getFileBy(id).catch((err) => {
          console.log(err);
          throw Boom.badImplementation('Could not get file');
        });
        if (!file) throw Boom.notFound('File was not found');
        const qInstance =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            file.questionnaire_instance_id
          ).catch((err) => {
            console.log(err);
            throw Boom.notFound('Questionnaire instance not found');
          });
        await pgHelper
          .getStudyAccessForUser(qInstance.study_id, username)
          .catch((err) => {
            console.log(err);
            throw Boom.forbidden('Wrong access for this command');
          });
        return file;
      }
      case 'Forscher': {
        const file = await pgHelper.getFileBy(id).catch((err) => {
          console.log(err);
          throw Boom.badImplementation('Could not get file');
        });
        if (!file) throw Boom.notFound('File was not found');
        const qInstance =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForResearcher(
            file.questionnaire_instance_id
          ).catch((err) => {
            console.log(err);
            throw Boom.notFound('Questionnaire instance not found');
          });
        if (
          !(
            qInstance.status === 'released_once' ||
            qInstance.status === 'released_twice' ||
            qInstance.status === 'released'
          )
        ) {
          throw Boom.notFound('File has not been released yet');
        }
        await pgHelper
          .getStudyAccessForUser(qInstance.study_id, username)
          .catch((err) => {
            console.log(err);
            throw Boom.forbidden('Wrong access for this command');
          });
        return file;
      }
      default:
        throw Boom.forbidden('Wrong role for this command');
    }
  }

  return {
    /**
     * @function
     * @description gets the file by its ID
     * @memberof module:fileInteractor
     * @param {string} id the file ID
     * @param {string} decodedToken the jwt of the request
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getFileById: getFileById,
  };
})();

module.exports = fileInteractor;
