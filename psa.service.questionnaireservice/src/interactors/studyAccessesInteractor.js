/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const q = require('q');

/**
 * @description interactor that handles study access requests based on users permissions
 */
const studyAccessesInteractor = (function () {
  function getStudyAccess(decodedToken, study_name, username, pgHelper) {
    const deferred = q.defer();

    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'Untersuchungsteam':
        pgHelper
          .getUser(username)
          .then(function (user) {
            if (user.role !== 'Proband') {
              deferred.reject(
                'Could not get study access: UntersuchungstTeam can only get access from a Proband'
              );
            } else {
              pgHelper
                .getStudyAccessForUser(study_name, requesterName)
                .then(function (result) {
                  if (
                    result.access_level === 'read' ||
                    result.access_level === 'write' ||
                    result.access_level === 'admin'
                  ) {
                    pgHelper
                      .getStudyAccessForUser(study_name, username)
                      .then(function (result) {
                        deferred.resolve(result);
                      })
                      .catch((err) => {
                        console.log(err);
                        deferred.reject('Could not get study access: ' + err);
                      });
                  } else {
                    deferred.reject(
                      'Could not get study access: Forscher has unknown access level to study'
                    );
                  }
                })
                .catch(() => {
                  deferred.reject(
                    'Could not get study access, because Forscher has no access to study'
                  );
                });
            }
          })
          .catch(() => {
            deferred.reject('Could not get study access: User does not exist');
          });
        break;

      case 'SysAdmin':
        pgHelper
          .getUser(username)
          .then(function (user) {
            if (user.role !== 'Proband') {
              pgHelper
                .getStudyAccessForUser(study_name, username)
                .then(function (result) {
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not get study access: ' + err);
                });
            } else {
              deferred.reject(
                'Could not get study access: SysAdmin can only get access for professional users'
              );
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject(err);
          });

        break;

      default:
        deferred.reject('Could not get study access: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function getStudyAccesses(decodedToken, study_name, pgHelper) {
    const deferred = q.defer();

    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'Untersuchungsteam':
        pgHelper
          .getStudyAccessForUser(study_name, requesterName)
          .then(function (result) {
            if (
              result.access_level === 'read' ||
              result.access_level === 'write' ||
              result.access_level === 'admin'
            ) {
              pgHelper
                .getProbandStudyAccessesForStudy(study_name)
                .then(function (result) {
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not get study accesses: ' + err);
                });
            } else {
              deferred.reject(
                'Could not get study accesses: Untersuchungsteam has unknown access level to study'
              );
            }
          })
          .catch(() => {
            deferred.reject(
              'Could not get study accesses, because Untersuchungsteam has no access to study'
            );
          });
        break;

      case 'SysAdmin':
        pgHelper
          .getProfessionalsStudyAccessesForStudy(study_name)
          .then(function (result) {
            deferred.resolve(result);
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not get study accesses: ' + err);
          });
        break;

      default:
        deferred.reject('Could not get study accesses: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function deleteStudyAccess(decodedToken, study_name, username, pgHelper) {
    const deferred = q.defer();

    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'Untersuchungsteam':
        pgHelper
          .getStudyAccessForUser(study_name, requesterName)
          .then(function (result) {
            if (
              result.access_level === 'write' ||
              result.access_level === 'admin'
            ) {
              pgHelper
                .getUser(username)
                .then(function (user) {
                  if (user.role === 'Proband') {
                    pgHelper
                      .getAnsweredQuestionnaireInstances(
                        study_name,
                        user.username
                      )
                      .then(async function (answeredQuestionnaireInstances) {
                        const study_accesses =
                          await pgHelper.getStudyAccessesForUser(user.username);
                        if (
                          answeredQuestionnaireInstances.length === 0 &&
                          study_accesses.length > 1
                        ) {
                          pgHelper
                            .deleteStudyAccess(study_name, username)
                            .then(function (result) {
                              deferred.resolve(result);
                            })
                            .catch((err) => {
                              console.log(err);
                              deferred.reject(
                                'Could not delete study access: ' + err
                              );
                            });
                        } else {
                          deferred.reject(
                            'Could not delete study accesses: Proband already answered some questionnaires or is only assigned to this study'
                          );
                        }
                      });
                  } else {
                    deferred.reject(
                      'Could not delete study accesses: Untersuchungsteam can only delete access level for Proband'
                    );
                  }
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not delete study access: ' + err);
                });
            } else {
              deferred.reject(
                'Could not delete study accesses: Untersuchungsteam has unknown access level to study'
              );
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not delete study access: ' + err);
          });

        break;

      case 'SysAdmin':
        pgHelper
          .getUser(username)
          .then(function (user) {
            if (user.role !== 'Proband') {
              pgHelper
                .deleteStudyAccess(study_name, username)
                .then(function (result) {
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not delete study access: ' + err);
                });
            } else {
              deferred.reject(
                'SysAdmin cannot delete study access for Proband'
              );
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not delete study access: ' + err);
          });
        break;

      default:
        deferred.reject('Could not delete study access: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function createStudyAccess(decodedToken, study_name, study_access, pgHelper) {
    const deferred = q.defer();

    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'Untersuchungsteam':
        pgHelper
          .getStudyAccessForUser(study_name, requesterName)
          .then(function (result) {
            if (
              result.access_level === 'write' ||
              result.access_level === 'admin'
            ) {
              pgHelper
                .getUser(study_access.user_id)
                .then(function (result) {
                  if (
                    result.role === 'Proband' &&
                    study_access.access_level !== 'read'
                  ) {
                    deferred.reject(
                      'Could not create study access: Probands can only get read access'
                    );
                  } else if (result.role !== 'Proband') {
                    deferred.reject(
                      'UntersuchungsTeam can only create study access for Probands'
                    );
                  } else {
                    pgHelper
                      .createStudyAccess(study_name, study_access)
                      .then(function (result) {
                        deferred.resolve(result);
                      })
                      .catch((err) => {
                        console.log(err);
                        deferred.reject(
                          'Could not create study access: ' + err
                        );
                      });
                  }
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not create study access: ' + err);
                });
            } else {
              deferred.reject(
                'Untersuchungsteam only has read access to study'
              );
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not create study access: ' + err);
          });
        break;

      case 'SysAdmin':
        pgHelper
          .getUser(study_access.user_id)
          .then(function (result) {
            if (result.role === 'Proband' || result.role === 'SysAdmin') {
              deferred.reject(
                'Could not create study access: SysAdmins cannot create study access for Probands or SysAdmins'
              );
            } else {
              pgHelper
                .createStudyAccess(study_name, study_access)
                .then(function (result) {
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not create study access: ' + err);
                });
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not create study access: ' + err);
          });
        break;

      default:
        deferred.reject('Could not create studyaccess: Unknown or wrong role');
    }
    return deferred.promise;
  }

  function updateStudyAccess(
    decodedToken,
    study_name,
    username,
    study_access,
    pgHelper
  ) {
    const deferred = q.defer();

    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
        pgHelper
          .getUser(username)
          .then(function (result) {
            if (result.role === 'Proband' || result.role === 'SysAdmin') {
              deferred.reject(
                'Could not update study access: SysAdmins cannot update study access for Probands or SysAdmins'
              );
            } else {
              pgHelper
                .updateStudyAccess(study_name, username, study_access)
                .then(function (result) {
                  deferred.resolve(result);
                })
                .catch((err) => {
                  console.log(err);
                  deferred.reject('Could not update study access: ' + err);
                });
            }
          })
          .catch((err) => {
            console.log(err);
            deferred.reject('Could not create study access: ' + err);
          });
        break;

      default:
        deferred.reject('Could not update study access: Unknown or wrong role');
    }
    return deferred.promise;
  }

  return {
    /**
     * @function
     * @description gets a study access from DB if user is allowed to
     * @memberof module:studyAccessesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} study_name the study name of the access to get
     * @param {string} username the username of the access to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudyAccess: getStudyAccess,

    /**
     * @function
     * @description gets all study accesses from DB the user has access to
     * @memberof module:studyAccessesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} study_name the study name of the accesses to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getStudyAccesses: getStudyAccesses,

    /**
     * @function
     * @description deletes a study access from DB if user is allowed to
     * @memberof module:studyAccessesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} study_name the study name of the access to delete
     * @param {string} username the username of the access to delete
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deleteStudyAccess: deleteStudyAccess,

    /**
     * @function
     * @description creates a study access in DB if user is allowed to
     * @memberof module:studyAccessesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} study_name the study name of the access to create
     * @param {object} access_access the study access to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createStudyAccess: createStudyAccess,

    /**
     * @function
     * @description updates a study access in DB if user is allowed to
     * @memberof module:studyAccessesInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} study_name the study name of the access to update
     * @param {string} username the username of the access to update
     * @param {object} access_access the study access to update
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateStudyAccess: updateStudyAccess,
  };
})();

module.exports = studyAccessesInteractor;
