const q = require('q');

/**
 * @description interactor that handles questionnaire requests based on users permissions
 */
const questionnairesInteractor = (function () {
  function deleteQuestionnaire(decodedToken, id, version, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        deferred.reject(
          'Could not delete questionnaire: Probands cannot delete questionnaires'
        );
        break;
      case 'Forscher':
        pgHelper
          .getQuestionnaire(id, version)
          .then(function (result) {
            const study_id = result.study_id;
            pgHelper
              .getStudyAccessForUser(study_id, userName)
              .then(function (result) {
                if (
                  result.access_level === 'write' ||
                  result.access_level === 'admin'
                ) {
                  pgHelper
                    .deleteQuestionnaire(id, version)
                    .then(function () {
                      deferred.resolve(null);
                    })
                    .catch((err) => {
                      deferred.reject('Could not delete questionnaire: ' + err);
                    });
                } else {
                  deferred.reject(
                    'Could not delete questionnaire: Forscher only has read access for questionnaires study'
                  );
                }
              })
              .catch((err) => {
                console.log(err);
                deferred.reject(
                  'Could not delete questionnaire, because user has no access to study'
                );
              });
          })
          .catch((err) => {
            console.log(err);
            deferred.reject(
              'Could not delete questionnaire, because it does not exist'
            );
          });
        break;
      default:
        deferred.reject(
          'Could not delete questionnaire: Unknown role or no role specified'
        );
    }

    return deferred.promise;
  }

  function createQuestionnaire(decodedToken, questionnaire, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        deferred.reject(
          'Could not create questionnaire: Probands cannot create questionnaires'
        );
        break;
      case 'Forscher':
        pgHelper
          .getStudyAccessForUser(questionnaire.study_id, userName)
          .then(function (result) {
            if (
              result.access_level === 'write' ||
              result.access_level === 'admin'
            ) {
              pgHelper
                .insertQuestionnaire(questionnaire)
                .then(function (result) {
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not create questionnaire: ' + err);
                });
            } else {
              deferred.reject(
                'Could not create questionnaire: Forscher only has read access for questionnaires study'
              );
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject(
              'Could not create questionnaire, because user has no access to study'
            );
          });
        break;
      default:
        deferred.reject(
          'Could not create questionnaire: Unknown role or no role specified'
        );
    }

    return deferred.promise;
  }

  function updateQuestionnaire(
    decodedToken,
    id,
    version,
    updatedQuestionnaire,
    pgHelper
  ) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        deferred.reject(
          'Could not update questionnaire: Probands cannot update questionnaires'
        );
        break;
      case 'Forscher':
        pgHelper
          .getQuestionnaire(id, version)
          .then(function (result) {
            const old_study_id = result.study_id;
            const new_study_id = updatedQuestionnaire.study_id;
            pgHelper
              .getStudyAccessForUser(old_study_id, userName)
              .then(function (old_result) {
                pgHelper
                  .getStudyAccessForUser(new_study_id, userName)
                  .then(function (new_result) {
                    if (
                      (old_result.access_level === 'write' ||
                        old_result.access_level === 'admin') &&
                      (new_result.access_level === 'write' ||
                        new_result.access_level === 'admin')
                    ) {
                      pgHelper
                        .updateQuestionnaire(updatedQuestionnaire, id, version)
                        .then(function (result) {
                          deferred.resolve(result);
                        })
                        .catch((err) => {
                          console.log(err);
                          deferred.reject(
                            'Could not update questionnaire: ' + err
                          );
                        });
                    } else {
                      deferred.reject(
                        'Could not update questionnaire: Forscher only has read access for old or new questionnaires study'
                      );
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    deferred.reject(
                      'Could not update questionnaire, because user has no access'
                    );
                  });
              })
              .catch((err) => {
                console.log(err);
                deferred.reject(
                  'Could not update questionnaire, because user has no access'
                );
              });
          })
          .catch((err) => {
            console.log(err);
            deferred.reject(
              'Could not update questionnaire, because it does not exist'
            );
          });
        break;
      default:
        deferred.reject(
          'Could not update questionnaire: Unknown role or no role specified'
        );
    }

    return deferred.promise;
  }

  function reviseQuestionnaire(
    decodedToken,
    id,
    revisedQuestionnaire,
    pgHelper
  ) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        deferred.reject(
          'Could not revise questionnaire: Probands cannot revise questionnaires'
        );
        break;
      case 'Forscher':
        pgHelper
          .getQuestionnaire(id)
          .then(function (result) {
            const old_study_id = result.study_id;
            const new_study_id = revisedQuestionnaire.study_id;
            pgHelper
              .getStudyAccessForUser(old_study_id, userName)
              .then(function (old_result) {
                pgHelper
                  .getStudyAccessForUser(new_study_id, userName)
                  .then(function (new_result) {
                    if (
                      (old_result.access_level === 'write' ||
                        old_result.access_level === 'admin') &&
                      (new_result.access_level === 'write' ||
                        new_result.access_level === 'admin')
                    ) {
                      pgHelper
                        .reviseQuestionnaire(revisedQuestionnaire, id)
                        .then(function (result) {
                          deferred.resolve(result);
                        })
                        .catch((err) => {
                          console.log(err);
                          deferred.reject(
                            'Could not revise questionnaire: ' + err
                          );
                        });
                    } else {
                      deferred.reject(
                        'Could not revise questionnaire: Forscher only has read access for old or new questionnaires study'
                      );
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    deferred.reject(
                      'Could not revise questionnaire, because user has no access'
                    );
                  });
              })
              .catch((err) => {
                console.log(err);
                deferred.reject(
                  'Could not revise questionnaire, because user has no access'
                );
              });
          })
          .catch((err) => {
            console.log(err);
            deferred.reject(
              'Could not revise questionnaire, because previous version does not exist'
            );
          });
        break;
      default:
        deferred.reject(
          'Could not revise questionnaire: Unknown role or no role specified'
        );
    }

    return deferred.promise;
  }

  async function getQuestionnaire(decodedToken, id, version, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    let resultQuestionnaireByID;

    const questionnaireNotFoundHandler = (err) => {
      console.log(err);
      deferred.reject('Could not get questionnaire, because it does not exist');
      return deferred.promise;
    };

    switch (userRole) {
      case 'Proband': {
        const user = await pgHelper.getUser(userName);
        resultQuestionnaireByID = await pgHelper
          .getQuestionnaire(id, version)
          .catch(questionnaireNotFoundHandler);
        if (
          !user.compliance_samples &&
          resultQuestionnaireByID.compliance_needed
        ) {
          deferred.reject(
            'Could not get questionnaire: User hast not complied to see this questionnaire'
          );
        }
        break;
      }
      case 'Forscher':
        resultQuestionnaireByID = await pgHelper
          .getQuestionnaire(id, version)
          .catch(questionnaireNotFoundHandler);
        break;

      default:
        deferred.reject(
          'Could not get questionnaire, because user role is not valid'
        );
    }
    pgHelper
      .getStudyAccessForUser(resultQuestionnaireByID.study_id, userName)
      .then(function (result) {
        if (
          result.access_level === 'read' ||
          result.access_level === 'write' ||
          result.access_level === 'admin'
        ) {
          deferred.resolve(resultQuestionnaireByID);
        } else {
          deferred.reject(
            'Could not get questionnaire: Unknown access level to questionnaire'
          );
        }
      })
      .catch((err) => {
        console.log(err);
        deferred.reject(
          'Could not get questionnaire, because user has no access'
        );
      });

    return deferred.promise;
  }

  async function getQuestionnaires(decodedToken, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    const studyIDs = [];
    const studyAccesses = await pgHelper
      .getStudyAccessesForUser(userName)
      .catch((err) => {
        console.log(err);
        return [];
      });
    studyAccesses.forEach(function (studyAccess) {
      studyIDs.push(studyAccess.study_id);
    });

    switch (userRole) {
      case 'Forscher':
        return await pgHelper
          .getQuestionnairesByStudyIds(studyIDs)
          .catch((err) => {
            console.log(err);
            return [];
          });
      default:
        throw new Error(
          'Could not get questionnaire, because user role is not valid'
        );
    }
  }

  return {
    /**
     * @function
     * @description deletes questionnaire from DB if user is allowed to
     * @memberof module:questionnairesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} id the id of the questionnaire to delete
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deleteQuestionnaire: deleteQuestionnaire,

    /**
     * @function
     * @description creates questionnaire from DB if user is allowed to
     * @memberof module:questionnairesInteractor
     * @param {string} userToken the jwt of the request
     * @param {object} questionnaire the questionnaire to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createQuestionnaire: createQuestionnaire,

    /**
     * @function
     * @description updates a questionnaire from DB if user is allowed to
     * @memberof module:questionnairesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} id the id of the questionnaire to update
     * @param {object} updatedQuestionnaire the updated questionnaire
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateQuestionnaire: updateQuestionnaire,

    /**
     * @function
     * @description revises a questionnaire from DB if user is allowed to
     * @memberof module:questionnairesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} id the id of the questionnaire to revise
     * @param {object} updatedQuestionnaire the new questionnaire
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    reviseQuestionnaire: reviseQuestionnaire,

    /**
     * @function
     * @description gets a questionnaire from DB if user is allowed to
     * @memberof module:questionnairesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} id the id of the questionnaire to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getQuestionnaire: getQuestionnaire,

    /**
     * @function
     * @description gets all questionnaires from DB the user has access to
     * @memberof module:questionnairesInteractor
     * @param {string} userToken the jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getQuestionnaires: getQuestionnaires,
  };
})();

module.exports = questionnairesInteractor;
