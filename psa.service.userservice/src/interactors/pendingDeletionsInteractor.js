/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const validator = require('email-validator');
const postgresHelper = require('../services/postgresqlHelper');
const loggingserviceClient = require('../clients/loggingserviceClient');
const personaldataserviceClient = require('../clients/personaldataserviceClient');
const { runTransaction } = require('../db');

const mailService = require('../services/mailService.js');
const { config } = require('../config');

/**
 * @description interactor that handles pending deletion requests based on users permissions
 */
const pendingDeletionsInteractor = (function () {
  async function getPendingDeletion(decodedToken, id, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
      case 'SysAdmin':
        try {
          const pendingDeletion = await pgHelper.getPendingDeletion(id);
          if (
            pendingDeletion.requested_for !== userName &&
            pendingDeletion.requested_by !== userName
          ) {
            return Boom.forbidden(
              'The requester is not allowed to get this pending deletion'
            );
          } else {
            return pendingDeletion;
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending deletion was not found');
        }

      default:
        return Boom.forbidden(
          'Could not get the pending deletion: Unknown or wrong role'
        );
    }
  }

  async function getPendingDeletionForProbandId(
    decodedToken,
    proband_id,
    pgHelper
  ) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
        try {
          const pendingDeletion = await pgHelper.getPendingDeletionForProbandId(
            proband_id
          );
          if (
            pendingDeletion.requested_for !== userName &&
            pendingDeletion.requested_by !== userName
          ) {
            return Boom.forbidden(
              'The requester is not allowed to get this pending deletion'
            );
          } else {
            return pendingDeletion;
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending deletion was not found');
        }

      default:
        return Boom.forbidden(
          'Could not get the pending deletion: Unknown or wrong role'
        );
    }
  }

  async function getPendingDeletionForSampleId(
    decodedToken,
    sample_id,
    pgHelper
  ) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
        try {
          const pendingDeletion = await pgHelper.getPendingDeletionForSampleId(
            sample_id
          );
          if (
            pendingDeletion.requested_for !== userName &&
            pendingDeletion.requested_by !== userName
          ) {
            return Boom.forbidden(
              'The requester is not allowed to get this pending deletion'
            );
          } else {
            return pendingDeletion;
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending deletion was not found');
        }

      default:
        return Boom.forbidden(
          'Could not get the pending deletion: Unknown or wrong role'
        );
    }
  }

  async function getPendingDeletionForStudyId(
    decodedToken,
    study_id,
    pgHelper
  ) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'SysAdmin':
        try {
          const pendingDeletion = await pgHelper.getPendingDeletionForStudyId(
            study_id
          );
          if (
            pendingDeletion.requested_for !== userName &&
            pendingDeletion.requested_by !== userName
          ) {
            return Boom.forbidden(
              'The requester is not allowed to get this pending deletion'
            );
          } else {
            return pendingDeletion;
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending deletion was not found');
        }

      default:
        return Boom.forbidden(
          'Could not get the pending deletion: Unknown or wrong role'
        );
    }
  }

  async function createPendingDeletion(decodedToken, data, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    const createProbandDeletionEmailContent = function (
      proband,
      confirmationURL
    ) {
      return {
        subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
        text:
          'Ein:e andere:r Probandenmanager:in möchte den "vollständigen Widerspruch" eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
          '\n\n' +
          confirmationURL +
          '\n\n' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:\n' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
          '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.\n' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.\n',
        html:
          'Ein:e andere:r Probandenmanager:in möchte den "vollständigen Widerspruch" eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
          '<br><br><a href="' +
          confirmationURL +
          '">' +
          confirmationURL +
          '</a><br><br>' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:<br>' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
          '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.<br>' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.<br>',
      };
    };

    const createProbandDeletionConfirmationUrl = function (id) {
      return (
        config.webappUrl +
        `/probands-personal-info?probandIdToDelete=${id}&type=general`
      );
    };

    const createStudyDeletionEmailContent = function (confirmationURL) {
      return {
        subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
        text:
          'Ein:e andere:r Systemadministrator:in möchte die vollständige Löschung einer Studie durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
          '\n\n' +
          confirmationURL +
          '\n\n',
        html:
          'Ein:e andere:r Systemadministrator:in möchte die vollständige Löschung einer Studie durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
          '<br><br><a href="' +
          confirmationURL +
          '">' +
          confirmationURL +
          '</a><br><br>',
      };
    };

    const createStudyDeletionConfirmationUrl = function (id) {
      return config.webappUrl + `/studies?pendingDeletionId=${id}&type=study`;
    };

    const createSampleDeletionEmailContent = function (
      proband,
      sample_id,
      confirmationURL
    ) {
      return {
        subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
        text:
          'Ein:e andere:r Probandenmanager:in möchte die Löschung einer Probe eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
          '\n\n' +
          confirmationURL +
          '\n\n' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:\n' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
          '- Klicken Sie links im Menü auf "Probenverwaltung" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.\n' +
          '- Klicken Sie bei diesem Teilnehmenden auf "Details" (Auge) und suchen Sie in der Liste nach der Probe mit der ID, die der:die Löschpartner:in Ihnen telefonisch übergeben kann.\n' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.\n',
        html:
          'Ein:e andere:r Probandenmanager:in möchte die Löschung einer Probe eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
          '<br><br><a href="' +
          confirmationURL +
          '">' +
          confirmationURL +
          '</a><br><br>' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:<br>' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
          '- Klicken Sie links im Menü auf "Probenverwaltung" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.<br>' +
          '- Klicken Sie bei diesem Teilnehmenden auf "Details" (Auge) und suchen Sie in der Liste nach der Probe mit der ID, die der:die Löschpartner:in Ihnen telefonisch übergeben kann.<br>' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.<br>',
      };
    };

    const createSampleDeletionConfirmationUrl = function (pseudonym, id) {
      return (
        config.webappUrl +
        `/sample-management/${pseudonym}?pendingDeletionId=${id}`
      );
    };

    switch (userRole) {
      case 'ProbandenManager':
        try {
          const requested_for = await pgHelper.getUser(data.requested_for);
          data.requested_by = userName;
          if (data.type === 'proband') {
            const proband = await pgHelper.getUser(data.for_id);
            const existingPendingDeletion =
              await pgHelper.getPendingDeletionForProbandIdIfExisting(
                data.for_id
              );
            const requested_accesses = await pgHelper.getStudyAccessesForUser(
              data.requested_for
            );
            const requester_accesses = await pgHelper.getStudyAccessesForUser(
              data.requested_by
            );

            const superStudyOfProband = await pgHelper.getStudy(
              proband.study_accesses[0].study_id
            );

            if (
              superStudyOfProband.has_four_eyes_opposition &&
              superStudyOfProband.has_total_opposition
            ) {
              if (
                data.requested_for !== userName &&
                requested_for &&
                requested_for.role === 'ProbandenManager' &&
                validator.validate(data.requested_for)
              ) {
                if (proband && !existingPendingDeletion) {
                  const foundOne = proband.study_accesses.find(function (
                    study_access
                  ) {
                    return (
                      requested_accesses.find(function (requested_access) {
                        return (
                          requested_access.study_id === study_access.study_id
                        );
                      }) &&
                      requester_accesses.find(function (requester_access) {
                        return (
                          requester_access.study_id === study_access.study_id
                        );
                      })
                    );
                  });
                  if (!foundOne) {
                    return Boom.forbidden(
                      'ProbandenManager can only create pending deletions for probands from his studies'
                    );
                  } else {
                    const pendingDeletion =
                      await pgHelper.createPendingDeletion(data);
                    const result = await mailService
                      .sendMail(
                        data.requested_for,
                        createProbandDeletionEmailContent(
                          data.for_id,
                          createProbandDeletionConfirmationUrl(data.for_id)
                        )
                      )
                      .catch(async (err) => {
                        await pgHelper.cancelPendingDeletion(
                          pendingDeletion.id
                        );
                        console.log(err);
                        return Boom.badData(
                          'PM could not be reached via email: ' + err
                        );
                      });
                    if (result) {
                      return pendingDeletion;
                    } else {
                      return Boom.badData('PM could not be reached via email');
                    }
                  }
                } else {
                  return Boom.forbidden(
                    'Proband not found or deletion already requested'
                  );
                }
              } else {
                return Boom.badData(
                  'Some data was not fitting, is the PMs username an email address?'
                );
              }
            } else if (superStudyOfProband.has_total_opposition) {
              // No 4 eye deletion in study, delete instantly
              return await executePendingDeletion(-1, data);
            } else {
              return Boom.forbidden(
                'This operation cannot be done for this study'
              );
            }
          } else if (data.type === 'sample') {
            if (
              data.requested_for !== userName &&
              requested_for &&
              requested_for.role === 'ProbandenManager' &&
              validator.validate(data.requested_for)
            ) {
              const sample = await pgHelper.getLabResult(data.for_id);
              const proband = await pgHelper.getUser(sample.user_id);
              const existingPendingDeletion =
                await pgHelper.getPendingDeletionForSampleIdIfExisting(
                  data.for_id
                );
              const requested_accesses = await pgHelper.getStudyAccessesForUser(
                data.requested_for
              );
              const requester_accesses = await pgHelper.getStudyAccessesForUser(
                data.requested_by
              );
              if (proband && !existingPendingDeletion) {
                const foundOne = proband.study_accesses.find(function (
                  study_access
                ) {
                  return (
                    requested_accesses.find(function (requested_access) {
                      return (
                        requested_access.study_id === study_access.study_id
                      );
                    }) &&
                    requester_accesses.find(function (requester_access) {
                      return (
                        requester_access.study_id === study_access.study_id
                      );
                    })
                  );
                });
                if (!foundOne) {
                  return Boom.forbidden(
                    'ProbandenManager can only create pending deletions for samples from his studies'
                  );
                } else {
                  const pendingDeletion = await pgHelper.createPendingDeletion(
                    data
                  );
                  const result = await mailService
                    .sendMail(
                      data.requested_for,
                      createSampleDeletionEmailContent(
                        proband.username,
                        sample.id,
                        createSampleDeletionConfirmationUrl(
                          sample.user_id,
                          pendingDeletion.id
                        )
                      )
                    )
                    .catch(async (err) => {
                      await pgHelper.cancelPendingDeletion(pendingDeletion.id);
                      console.log(err);
                      return Boom.badData(
                        'PM could not be reached via email: ' + err
                      );
                    });
                  if (result) {
                    return pendingDeletion;
                  } else {
                    return Boom.badData('PM could not be reached via email');
                  }
                }
              } else {
                return Boom.forbidden(
                  'Proband which the sample belongs to not found or deletion already requested'
                );
              }
            } else {
              return Boom.badData(
                'Some data was not fitting, is the PMs username an email address?'
              );
            }
          } else {
            return Boom.badData('Wrong pending deletion type');
          }
        } catch (err) {
          console.log(err);
          return Boom.badData('Some data was not fitting');
        }

      case 'SysAdmin':
        try {
          const requested_for = await pgHelper.getUser(data.requested_for);
          if (
            data.requested_for !== userName &&
            requested_for &&
            requested_for.role === 'SysAdmin' &&
            validator.validate(data.requested_for)
          ) {
            data.requested_by = userName;
            if (data.type === 'study') {
              const study = await pgHelper.getStudy(data.for_id);
              const existingPendingDeletion =
                await pgHelper.getPendingDeletionForStudyIdIfExisting(
                  data.for_id
                );
              if (study && !existingPendingDeletion) {
                const pendingDeletion = await pgHelper.createPendingDeletion(
                  data
                );
                const result = await mailService
                  .sendMail(
                    data.requested_for,
                    createStudyDeletionEmailContent(
                      createStudyDeletionConfirmationUrl(pendingDeletion.id)
                    )
                  )
                  .catch(async (err) => {
                    await pgHelper.cancelPendingDeletion(pendingDeletion.id);
                    console.log(err);
                    return Boom.badData(
                      'Sysadmin could not be reached via email: ' + err
                    );
                  });
                if (result) {
                  return pendingDeletion;
                } else {
                  return Boom.badData(
                    'Sysadmin could not be reached via email'
                  );
                }
              } else {
                return Boom.forbidden(
                  'Study not found or deletion already requested'
                );
              }
            } else {
              return Boom.badData('Wrong pending deletion type');
            }
          } else {
            return Boom.badData(
              'Some data was not fitting, is the SysAdmins username an email address?'
            );
          }
        } catch (err) {
          console.log(err);
          return Boom.badData('Some data was not fitting');
        }

      default:
        return Boom.forbidden(
          'Could not create the pending deletion: Unknown or wrong role'
        );
    }
  }

  async function executePendingDeletion(id, newPD = null) {
    return await runTransaction(async (t) => {
      const pendingDeletion = newPD
        ? newPD
        : await postgresHelper.getPendingDeletion(id);
      if (pendingDeletion.type === 'proband') {
        await postgresHelper.deleteProbandData(pendingDeletion.for_id, false, {
          transaction: t,
        });
        await personaldataserviceClient.deletePersonalDataOfUser(
          pendingDeletion.for_id
        );
        await loggingserviceClient.deleteLogs(pendingDeletion.for_id);
      } else if (pendingDeletion.type === 'sample') {
        await postgresHelper.deleteSampleData(pendingDeletion.for_id, {
          transaction: t,
        });
      } else if (pendingDeletion.type === 'study') {
        await postgresHelper.deleteStudyData(pendingDeletion.for_id, {
          transaction: t,
        });

        const studyProbands = await postgresHelper.getStudyProbands(
          pendingDeletion.for_id
        );
        if (studyProbands) {
          for (const proband of studyProbands) {
            await personaldataserviceClient.deletePersonalDataOfUser(proband);
          }
        }
      }
      await loggingserviceClient.createSystemLog({
        requestedBy: pendingDeletion.requested_by,
        requestedFor: pendingDeletion.requested_for,
        type: pendingDeletion.type,
      });
      if (!newPD) {
        await postgresHelper.deletePendingDeletion(id, { transaction: t });
      }
      return pendingDeletion;
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err);
    });
  }

  async function updatePendingDeletion(decodedToken, id, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'ProbandenManager' && userRole !== 'SysAdmin') {
      throw Boom.forbidden('Unknown or wrong role');
    }
    const pendingDeletion = await pgHelper
      .getPendingDeletion(id)
      .catch((err) => {
        console.log(err);
        throw Boom.notFound('The pending deletion could not be found');
      });
    if (
      pendingDeletion.requested_for !== userName ||
      (pendingDeletion.type === 'study' && userRole === 'ProbandenManager') ||
      (pendingDeletion.type === 'sample' && userRole === 'SysAdmin') ||
      (pendingDeletion.type === 'proband' && userRole === 'SysAdmin')
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to update this pending deletion'
      );
    } else {
      return await executePendingDeletion(id);
    }
  }

  async function cancelPendingDeletion(decodedToken, id, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
      case 'SysAdmin':
        try {
          const pendingDeletion = await pgHelper.getPendingDeletion(id);
          if (
            (pendingDeletion.requested_for !== userName &&
              pendingDeletion.requested_by !== userName) ||
            (pendingDeletion.type === 'study' &&
              userRole === 'ProbandenManager') ||
            (pendingDeletion.type === 'sample' && userRole === 'SysAdmin') ||
            (pendingDeletion.type === 'proband' && userRole === 'SysAdmin')
          ) {
            return Boom.forbidden(
              'The requester is not allowed to delete this pending deletion'
            );
          } else {
            return await pgHelper.cancelPendingDeletion(id);
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending deletion was not found');
        }

      default:
        return Boom.forbidden(
          'Could not delete the pending deletion: Unknown or wrong role'
        );
    }
  }

  return {
    /**
     * @function
     * @description gets a pending deletion from DB if user is allowed to
     * @memberof module:pendingDeletionsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the pending deletion to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPendingDeletion: getPendingDeletion,

    /**
     * @function
     * @description gets a pending deletion from DB if user is allowed to
     * @memberof module:pendingDeletionsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} proband_id the id of proband for the pending deletion to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPendingDeletionForProbandId: getPendingDeletionForProbandId,

    /**
     * @function
     * @description gets a pending deletion from DB if user is allowed to
     * @memberof module:pendingDeletionsInteractor
     * @param {string} decodedToken the decoded jwt of the request
     * @param {number} sample_id the id of sample for the pending deletion to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPendingDeletionForSampleId: getPendingDeletionForSampleId,

    /**
     * @function
     * @description gets a pending deletion from DB if user is allowed to
     * @memberof module:pendingDeletionsInteractor
     * @param {string} decodedToken the decoded jwt of the request
     * @param {number} study_id the id of study for the pending deletion to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPendingDeletionForStudyId: getPendingDeletionForStudyId,
    /**
     * @function
     * @description creates the pending deletion in DB if it does not exist and the requester is allowed to
     * @memberof module:pendingDeletionsInteractor
     * @param {string} decodedToken the decoded jwt of the request
     * @param {object} data the user object to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createPendingDeletion: createPendingDeletion,

    /**
     * @function
     * @description updates a pending deletion in DB, confirms deletion and delets all data
     * @memberof module:pendingDeletionsInteractor
     * @param {string} decodedToken the decoded jwt of the request
     * @param {number} id the id of the pending deletion to update
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updatePendingDeletion: updatePendingDeletion,

    /**
     * @function
     * @description deletes a pending deletion and cancels the deletion request
     * @memberof module:pendingDeletionsInteractor
     * @param {string} decodedToken the decoded jwt of the request
     * @param {number} id the id of the user to delete
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    cancelPendingDeletion: cancelPendingDeletion,
  };
})();

module.exports = pendingDeletionsInteractor;
