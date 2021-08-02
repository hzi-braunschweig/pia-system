/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const {
  QuestionnaireInstanceRepository,
} = require('../repositories/questionnaireInstanceRepository');

/**
 * @description interactor that handles questionnaire instance requests based on users permissions
 */
const questionnaireInstancesInteractor = (function () {
  async function getQuestionnaireInstance(decodedToken, id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist'
            );
          });
        if (result.questionnaire.questions.length === 0)
          throw new Error(
            'Could not get questionnaire instance, because conditions are not fulfilled'
          );
        if (result.questionnaire.type !== 'for_probands') {
          throw new Error(
            'Probands can only get instances with type for_probands'
          );
        }
        if (
          result.user_id === userName &&
          result.status !== 'inactive' &&
          result.status !== 'expired' &&
          result.status !== 'deleted'
        ) {
          return result;
        } else {
          throw new Error(
            'Could not get questionnaire instance, because user has no access'
          );
        }
      }
      case 'Untersuchungsteam': {
        const qInstanceResult =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist'
            );
          });
        if (qInstanceResult.questionnaire.questions.length === 0)
          throw new Error(
            'Could not get questionnaire instance, because conditions are not fulfilled'
          );
        if (qInstanceResult.questionnaire.type !== 'for_research_team') {
          throw new Error(
            'UT can only get instances with type for_research_team'
          );
        }
        if (!userStudies.includes(qInstanceResult.study_id)) {
          throw new Error(
            'Could not get questionnaire instance, because user has no access to study'
          );
        }
        if (
          qInstanceResult.status !== 'inactive' &&
          qInstanceResult.status !== 'expired' &&
          qInstanceResult.status !== 'deleted'
        ) {
          return qInstanceResult;
        } else {
          throw new Error(
            'Could not get questionnaire instance, because user has no access'
          );
        }
      }

      case 'Forscher': {
        const qInstanceResult =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceWithQuestionnaire(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist'
            );
          });
        if (qInstanceResult.questionnaire.questions.length === 0)
          throw new Error(
            'Could not get questionnaire instance, because conditions are not fulfilled'
          );
        if (!userStudies.includes(qInstanceResult.study_id)) {
          throw new Error(
            'Could not get questionnaire instance, because user has no access to study'
          );
        }
        return qInstanceResult;
      }

      default:
        throw new Error(
          'Could not get questionnaire instance: Unknown role or no role specified'
        );
    }
  }

  async function getQuestionnaireInstances(decodedToken, status) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        return QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsProband(
          userName,
          status
        ).catch((err) => {
          console.log(err);
          return [];
        });
      default:
        throw new Error(
          'Could not get questionnaire instances, because user role is not valid'
        );
    }
  }

  async function getQuestionnaireInstancesForUser(decodedToken, user_id) {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Forscher': {
        const probandQIs =
          await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsResearcher(
            user_id
          ).catch((err) => {
            console.log(err);
            return [];
          });
        return probandQIs.filter((probandQI) =>
          userStudies.includes(probandQI.study_id)
        );
      }
      case 'ProbandenManager': {
        const probandQIs =
          await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireAsPM(
            user_id
          ).catch((err) => {
            console.log(err);
            return [];
          });
        return probandQIs.filter((probandQI) =>
          userStudies.includes(probandQI.study_id)
        );
      }
      case 'Untersuchungsteam': {
        const probandQIs =
          await QuestionnaireInstanceRepository.getQuestionnaireInstancesAsInvestigator(
            user_id
          ).catch((err) => {
            console.log(err);
            return [];
          });
        return probandQIs.filter((probandQI) =>
          userStudies.includes(probandQI.study_id)
        );
      }
      default:
        throw new Error(
          'Could not get questionnaire instance: Unknown role or no role specified'
        );
    }
  }

  async function updateQuestionnaireInstance(
    decodedToken,
    id,
    status,
    progress,
    release_version
  ) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Proband': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForProband(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not update questionnaire instance, because it does not exist'
            );
          });
        if (result.user_id === userName) {
          if (
            ((result.status === 'active' || result.status === 'in_progress') &&
              status === 'released_once') ||
            (result.status === 'active' && status === 'in_progress') ||
            (result.status === 'released_once' &&
              status === 'released_twice') ||
            (!status && result.status !== 'released_twice')
          ) {
            return QuestionnaireInstanceRepository.updateQuestionnaireInstance(
              id,
              status,
              progress,
              release_version
            ).catch((err) => {
              console.log(err);
              throw new Error(
                'Could not update questionnaire instance: internal DB error'
              );
            });
          } else {
            throw new Error(
              'Could not update questionnaire instance, wrong state transition'
            );
          }
        } else {
          throw new Error(
            'Could not update questionnaire instance, because user has no access'
          );
        }
      }
      case 'Untersuchungsteam': {
        const result =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            id
          ).catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get questionnaire instance, because it does not exist or UT has no access'
            );
          });
        if (
          (result.status === 'released' && status === 'released') ||
          ((result.status === 'active' || result.status === 'in_progress') &&
            status === 'released') ||
          (result.status === 'active' && status === 'in_progress') ||
          !status
        ) {
          if (userStudies.includes(result.study_id)) {
            return await QuestionnaireInstanceRepository.updateQuestionnaireInstance(
              id,
              status,
              progress,
              release_version
            ).catch((err) => {
              console.log(err);
              throw new Error(
                'Could not update questionnaire instance: internal DB error'
              );
            });
          } else {
            throw new Error(
              'Could not get questionnaire instances because UT has no access'
            );
          }
        } else {
          throw new Error(
            'Could not update questionnaire instance, wrong state transition'
          );
        }
      }
      default:
        throw new Error(
          'Could not update questionnaire instance: Unknown or wrong role'
        );
    }
  }

  return {
    /**
     * @function
     * @description gets a questionnaire instance from DB if user is allowed to
     * @memberof module:questionnaireInstancesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} id the id of the questionnaire instance to get
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getQuestionnaireInstance: getQuestionnaireInstance,

    /**
     * @function
     * @description gets all questionnaire instances from DB the user has access to
     * @memberof module:questionnaireInstancesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string[]} status the status to filter the instances
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getQuestionnaireInstances: getQuestionnaireInstances,

    /**
     * @function
     * @description gets questionnaire instances from DB for the given user if the requester is allowed to
     * @memberof module:questionnaireInstancesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} user_id the id of the user to get questionnaire instances for
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getQuestionnaireInstancesForUser: getQuestionnaireInstancesForUser,

    /**
     * @function
     * @description updates a questionnaire instance in DB if user is allowed to
     * @memberof module:questionnaireInstancesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} id the id of the questionnaire instance to update
     * @param {boolean} released the new released status
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateQuestionnaireInstance: updateQuestionnaireInstance,
  };
})();

module.exports = questionnaireInstancesInteractor;
