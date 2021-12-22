/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const {
  QuestionnaireInstanceRepository,
} = require('../repositories/questionnaireInstanceRepository');
const pgHelper = require('../services/postgresqlHelper');
const answerTypesValidatorService = require('../services/answerTypesValidatorService');
const { assertStudyAccess } = require('../services/studyAccessAssert');

/**
 * @description interactor that handles answers requests based on users permissions
 */
const answersInteractor = (function () {
  async function createOrUpdateAnswers(
    decodedToken,
    qInstanceId,
    answers,
    version,
    date_of_release
  ) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    const isValid = await answerTypesValidatorService.validateFileAndImage(
      answers,
      userRole
    );

    if (isValid) {
      switch (userRole) {
        case 'Forscher':
          throw 'Could not update answers: Forscher cannot update answers';
        case 'Proband': {
          const result =
            await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
              qInstanceId
            ).catch((err) => {
              console.log(err);
              throw 'Could not update answers for questionnaire instance, because it does not exist';
            });
          if (
            result.user_id !== userName ||
            !(
              result.status === 'active' ||
              result.status === 'in_progress' ||
              result.status === 'released_once'
            )
          ) {
            throw 'Could not update answers for questionnaire instance, because user has no access';
          }
          if (result.status === 'released_once') {
            version = 2;
          }
          return await pgHelper
            .createOrUpdateAnswers(qInstanceId, answers, version)
            .catch((err) => {
              console.log(err);
              throw 'Could not update answers for questionnaire instance: internal DB error';
            });
        }
        case 'Untersuchungsteam': {
          const result =
            await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
              qInstanceId
            ).catch((err) => {
              console.log(err);
              throw 'Could not update answers for questionnaire instance, because it does not exist';
            });
          assertStudyAccess(result.study_id, decodedToken);
          return await pgHelper
            .createOrUpdateAnswers(
              qInstanceId,
              answers,
              version,
              date_of_release,
              date_of_release ? userName : null
            )
            .catch((err) => {
              console.log(err);
              throw 'Could not update answers for questionnaire instance: internal DB error';
            });
        }
        default:
          throw 'Could not update answers for questionnaire instance: Unknown or wrong role';
      }
    } else {
      throw 'Could not update answers: one of the answer has a not allowed file/image type';
    }
  }

  async function getAnswers(decodedToken, qInstanceId) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            qInstanceId
          ).catch((err) => {
            console.log(err);
            throw 'Could not get answers for questionnaire instance, because it does not exist';
          });
        if (result.user_id !== userName || result.status === 'deleted') {
          throw 'Could not get answers for questionnaire instance, because user has no access';
        }
        return await pgHelper.getAnswersForProband(qInstanceId).catch((err) => {
          console.log(err);
          throw 'Could not get answers for questionnaire instance: internal DB error';
        });
      }

      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            qInstanceId
          ).catch((err) => {
            console.log(err);
            throw 'Could not get answers for questionnaire instance, because it does not exist';
          });
        assertStudyAccess(result.study_id, decodedToken);
        return await pgHelper.getAnswersForProband(qInstanceId).catch((err) => {
          console.log(err);
          throw 'Could not get answers for questionnaire instance: internal DB error';
        });
      }
      case 'Forscher': {
        const qInstanceResult =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForResearcher(
            qInstanceId
          ).catch((err) => {
            console.log(err);
            throw 'Could not get answers for questionnaire instance, because it does not exist';
          });
        if (
          !(
            (qInstanceResult.status === 'released' ||
              qInstanceResult.status === 'released_once' ||
              qInstanceResult.status === 'released_twice') &&
            qInstanceResult.status !== 'deleted'
          )
        ) {
          throw 'Could not get answers for questionnaire instance, because they are not released or deleted';
        }
        assertStudyAccess(qInstanceResult.study_id, decodedToken);
        return await pgHelper
          .getAnswersForForscher(qInstanceId)
          .catch((err) => {
            console.log(err);
            throw 'Could not get answers for questionnaire instance: internal DB error';
          });
      }
      default:
        throw 'Could not get answers for questionnaire instance: Unknown or wrong role';
    }
  }

  async function getAnswersHistorical(decodedToken, qInstanceId) {
    const userRole = decodedToken.role;

    switch (userRole) {
      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            qInstanceId
          ).catch((err) => {
            console.log(err);
            throw 'Could not get historical answers for questionnaire instance, because it does not exist';
          });
        assertStudyAccess(result.study_id, decodedToken);
        return pgHelper
          .getHistoricalAnswersForInstance(qInstanceId)
          .catch((err) => {
            console.log(err);
            throw 'Could not get historical answers for questionnaire instance: internal DB error';
          });
      }
      default:
        throw 'Could not get historical answers for questionnaire instance: Unknown or wrong role';
    }
  }

  async function deleteAnswer(decodedToken, qInstanceId, answer_option_id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Forscher':
        throw 'Could not delete answer: Forscher cannot delete answers';
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            qInstanceId
          ).catch((err) => {
            console.log(err);
            throw 'Could not delete answer for questionnaire instance, because it does not exist';
          });
        if (
          result.user_id !== userName ||
          result.status === 'inactive' ||
          result.status === 'released_twice'
        ) {
          throw 'Could not delete answer for questionnaire instance, because user has no access';
        }
        const answerVersion = result.status === 'released_once' ? 2 : 1;
        return await pgHelper
          .deleteAnswer(qInstanceId, answer_option_id, answerVersion)
          .catch((err) => {
            console.log(err);
            throw 'Could not delete answer for questionnaire instance: internal DB error';
          });
      }
      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            qInstanceId
          ).catch((err) => {
            console.log(err);
            throw 'Could not delete answer for questionnaire instance, because it does not exist';
          });
        assertStudyAccess(result.study_id, decodedToken);
        return await pgHelper
          .deleteAnswer(qInstanceId, answer_option_id)
          .catch((err) => {
            console.log(err);
            throw 'Could not delete answer for questionnaire instance: internal DB error';
          });
      }
      default:
        throw 'Could not delete answer for questionnaire instance: Unknown or wrong role';
    }
  }

  return {
    /**
     * @function
     * @description creates or updates answers for a questionnaire instance
     * @memberof module:answersInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} qInstanceId the id of the questionnaire instance to update for
     * @param {array} answers the answers array
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createOrUpdateAnswers: createOrUpdateAnswers,

    /**
     * @function
     * @description gets the answers for a questionnaire instance
     * @memberof module:answersInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} qInstanceId the id of the questionnaire instance to get answers for
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getAnswers: getAnswers,

    /**
     * @function
     * @description gets the historical answers for a questionnaire instance
     * @memberof module:answersInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} qInstanceId the id of the questionnaire instance to get answers for
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getAnswersHistorical: getAnswersHistorical,

    /**
     * @function
     * @description deletes an answer of a questionnaire instance
     * @memberof module:answersInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} qInstanceId the id of the questionnaire instance to delete an answer from
     * @param {array} answer_option_id the id of the answer option to delete an answer from
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deleteAnswer: deleteAnswer,
  };
})();

module.exports = answersInteractor;
