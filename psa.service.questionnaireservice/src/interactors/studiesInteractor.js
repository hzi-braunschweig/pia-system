const q = require('q');
const Boom = require('@hapi/boom');

/**
 * @description interactor that handles study requests based on users permissions
 */
const studiesInteractor = (function () {
  function getStudy(decodedToken, id, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
      case 'ProbandenManager':
      case 'Forscher':
        pgHelper
          .getStudyAccessForUser(id, userName)
          .then(function (access_result) {
            if (
              access_result.access_level === 'read' ||
              access_result.access_level === 'write' ||
              access_result.access_level === 'admin'
            ) {
              pgHelper
                .getStudy(id)
                .then(function (study_result) {
                  study_result.access_level = access_result.access_level;
                  deferred.resolve(study_result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject(
                    'Could not get study, because it does not exist'
                  );
                });
            } else {
              deferred.reject(
                'Could not get study: Unknown access level to study'
              );
            }
          })
          .catch(() => {
            deferred.reject('Could not get study, because user has no access');
          });
        break;

      case 'Proband':
        pgHelper
          .getStudyAccessForUser(id, userName)
          .then(function (result) {
            if (result.access_level === 'read') {
              pgHelper
                .getStudy(id)
                .then(function (result) {
                  delete result.pm_email;
                  delete result.hub_email;
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject(
                    'Could not get study, because it does not exist'
                  );
                });
            } else {
              deferred.reject(
                'Could not get study: Unknown access level to study'
              );
            }
          })
          .catch(() => {
            deferred.reject('Could not get study, because user has no access');
          });
        break;

      case 'SysAdmin':
        pgHelper
          .getStudy(id)
          .then(function (result) {
            deferred.resolve(result);
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not get study: ' + err);
          });
        break;

      default:
        deferred.reject('Could not get study: Unknown or wrong role');
    }

    return deferred.promise;
  }

  function getStudies(decodedToken, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
      case 'ProbandenManager':
      case 'EinwilligungsManager':
      case 'Forscher':
        pgHelper
          .getStudyAccessesForUser(userName)
          .then(function (studyAccesses) {
            const studyIDs = [];
            studyAccesses.forEach(function (studyAccess) {
              studyIDs.push(studyAccess.study_id);
            });
            pgHelper
              .getStudiesByStudyIds(studyIDs)
              .then(function (result) {
                result.forEach(function (study) {
                  studyAccesses.forEach(function (studyAccess) {
                    if (studyAccess.study_id === study.name) {
                      study.access_level = studyAccess.access_level;
                    }
                  });
                });
                deferred.resolve(result);
              })
              .catch((err) => {
                console.log(err);
                deferred.resolve([]);
              });
          })
          .catch((err) => {
            console.log(err);
            deferred.resolve([]);
          });
        break;

      case 'Proband':
        pgHelper
          .getStudyAccessesForUser(userName)
          .then(function (studyAccesses) {
            const studyIDs = studyAccesses.map(
              (studyAccess) => studyAccess.study_id
            );
            pgHelper
              .getStudiesByStudyIds(studyIDs)
              .then(function (result) {
                result.forEach((study) => {
                  delete study.pm_email;
                  delete study.hub_email;
                });
                deferred.resolve(result);
              })
              .catch((err) => {
                console.log(err);
                deferred.resolve([]);
              });
          })
          .catch((err) => {
            console.log(err);
            deferred.resolve([]);
          });
        break;

      case 'SysAdmin':
        pgHelper
          .getStudies()
          .then(function (result) {
            deferred.resolve(result);
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not get studies: ' + err);
          });
        break;

      default:
        deferred.reject('Could not get studies: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function getStudiesOfProband(decodedToken, proband, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
      case 'ProbandenManager':
      case 'Forscher':
        pgHelper
          .getStudiesOfProbandForUser(proband, requester)
          .then(async function (studiesResult) {
            deferred.resolve(studiesResult);
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not get studies: Internal server error');
          });
        break;

      default:
        deferred.reject('Could not get studies: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function createStudy(decodedToken, study, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;

    switch (userRole) {
      case 'SysAdmin':
        pgHelper
          .createStudy(study)
          .then(function (result) {
            deferred.resolve(result);
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not create study: ' + err);
          });
        break;

      default:
        deferred.reject('Could not create study: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function updateStudy(decodedToken, id, study, pgHelper) {
    const deferred = q.defer();

    const userRole = decodedToken.role;

    switch (userRole) {
      case 'SysAdmin':
        pgHelper
          .updateStudyAsAdmin(id, study)
          .then(function (result) {
            deferred.resolve(result);
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not update study: ' + err);
          });
        break;

      default:
        deferred.reject('Could not update study: Unknown or wrong role');
    }
    return deferred.promise;
  }

  async function updateStudyWelcomeText(
    decodedToken,
    studyId,
    welcomeText,
    pgHelper
  ) {
    const userRole = decodedToken.role;
    switch (userRole) {
      case 'Forscher':
        try {
          return await pgHelper.updateStudyWelcomeText(studyId, welcomeText);
        } catch (err) {
          console.log(err);
          throw Boom.notFound('Could not update study welcome text: ' + err);
        }
      default:
        throw Boom.forbidden(
          'Could not update study welcome text: Unknown or wrong role'
        );
    }
  }

  async function getStudyWelcomeText(decodedToken, studyName, pgHelper) {
    const userRole = decodedToken.role;
    switch (userRole) {
      case 'Forscher':
      case 'Proband':
        try {
          return await pgHelper.getStudyWelcomeText(studyName);
        } catch (err) {
          console.log(err);
          throw Boom.notFound('Could not get study welcome text: ' + err);
        }
      default:
        throw Boom.forbidden(
          'Could not get study welcome text: Unknown or wrong role'
        );
    }
  }

  function getStudyAddresses(decodedToken, pgHelper) {
    const deferred = q.defer();
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        pgHelper
          .getStudyAccessesForUser(userName)
          .then(function (studyAccesses) {
            pgHelper
              .getStudyAddresses(studyAccesses.map((access) => access.study_id))
              .then(function (result) {
                deferred.resolve(result);
              })
              .catch((err) => {
                console.log(err);
                deferred.reject(
                  'Could not get study address, because it does not exist'
                );
              });
          })
          .catch((err) => {
            console.log(err);
            deferred.resolve([]);
          });
        break;

      default:
        deferred.reject('Could not get study address: Unknown or wrong role');
    }
    return deferred.promise;
  }

  return {
    /**
     * @function
     * @description gets a study from DB if user is allowed to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} id the id of the study to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudy: getStudy,

    /**
     * @function
     * @description gets all studies from DB the user has access to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudies: getStudies,

    /**
     * @function
     * @description gets all studies from DB the user has access to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} proband the probands username to get studies for
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudiesOfProband: getStudiesOfProband,

    /**
     * @function
     * @description creates a study in DB if user is allowed to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {object} study the study to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createStudy: createStudy,

    /**
     * @function
     * @description updates a study in DB if user is allowed to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} id the id of the study to update
     * @param {object} study the updates study
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateStudy: updateStudy,

    /**
     * @function
     * @description updates a study welcome text in DB if user is allowed to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} studyId the id of the study to update
     * @param {object} welcomeText the welcome text of the study
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateStudyWelcomeText: updateStudyWelcomeText,

    /**
     * @function
     * @description updates a study welcome text in DB if user is allowed to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} studyId the id of the study to update
     * @param {object} welcomeText the welcome text of the study
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudyWelcomeText: getStudyWelcomeText,

    /**
     * @function
     * @description gets a study address from DB if user is allowed to
     * @memberof module:studiesInteractor
     * @param {string} userToken the jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudyAddresses: getStudyAddresses,
  };
})();

module.exports = studiesInteractor;
