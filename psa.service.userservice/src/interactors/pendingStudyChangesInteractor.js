const Boom = require('@hapi/boom');
const validator = require('email-validator');

const mailService = require('../services/mailService.js');
const { config } = require('../config');
const studyHelper = require('../helpers/studyHelper');
const loggingserviceClient = require('../clients/loggingserviceClient');
const { runTransaction } = require('../db');

/**
 * @description interactor that handles pending study change requests based on users permissions
 */
const pendingStudyChangesInteractor = (function () {
  async function createPendingStudyChange(decodedToken, data, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    const createStudyChangeEmailContent = function (
      study_name,
      confirmationURL
    ) {
      return {
        subject: 'PIA - Sie wurden gebeten eine Studienänderung zu bestätigen',
        text:
          'Ein:e andere:r Forscher:in möchte die Daten der Studie "' +
          study_name +
          '" ändern und hat Sie als Änderungspartner ausgewählt. \n\n' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
          '\n\n' +
          confirmationURL +
          '\n\n' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:\n' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
          '- Klicken Sie links im Menü auf "Studien" und suchen Sie in der Liste nach "' +
          study_name +
          '".\n' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.\n',
        html:
          'Ein:e andere:r Forscher:in möchte die Daten der Studie "' +
          study_name +
          '" ändern und hat Sie als Änderungspartner ausgewählt.<br><br>' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
          '<br><br><a href="' +
          confirmationURL +
          '">' +
          confirmationURL +
          '</a><br><br>' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:<br>' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
          '- Klicken Sie links im Menü auf "Studien" und suchen Sie in der Liste nach "' +
          study_name +
          '".<br>' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.<br>',
      };
    };

    const createStudyChangeConfirmationUrl = function (id) {
      return (
        config.webappUrl + `/studies?pendingStudyChangeId=${id}&type=study`
      );
    };

    switch (userRole) {
      case 'Forscher':
        try {
          const requested_for = await pgHelper.getUser(data.requested_for);
          const requested_by = await pgHelper.getUser(userName);
          if (
            data.requested_for !== userName &&
            requested_for &&
            requested_for.role === 'Forscher' &&
            validator.validate(data.requested_for) &&
            !!requested_for.study_accesses.find(
              (access) =>
                access.study_id === data.study_id &&
                access.access_level === 'admin'
            ) &&
            !!requested_by.study_accesses.find(
              (access) =>
                access.study_id === data.study_id &&
                access.access_level === 'admin'
            )
          ) {
            if (
              data.pseudonym_prefix_to &&
              !studyHelper.hasExistingPseudonymPrefix(data.pseudonym_prefix_to)
            ) {
              return Boom.badData('STUDIES.INVALID_PSEUDONYM_PREFIX');
            }

            data.requested_by = userName;

            const existingPendingStudyChange =
              await pgHelper.getPendingStudyChangeForStudyIdIfExisting(
                data.study_id
              );

            if (!existingPendingStudyChange) {
              const pendingStudyChange =
                await pgHelper.createPendingStudyChange(data);
              const result = await mailService
                .sendMail(
                  data.requested_for,
                  createStudyChangeEmailContent(
                    pendingStudyChange.study_id,
                    createStudyChangeConfirmationUrl(pendingStudyChange.id)
                  )
                )
                .catch(async (err) => {
                  await pgHelper.deletePendingStudyChange(
                    pendingStudyChange.id
                  );
                  console.log(err);
                  return Boom.badData(
                    'Forscher could not be reached via email: ' + err
                  );
                });
              if (result) {
                return pendingStudyChange;
              } else {
                return Boom.badData('Forscher could not be reached via email');
              }
            } else {
              return Boom.forbidden(
                'Other changes to this study where already requested'
              );
            }
          } else {
            return Boom.badData(
              'Some data was not fitting, is the Forschers username an email address?'
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

  async function updatePendingStudyChange(decodedToken, id, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole === 'Forscher') {
      const pendingStudyChange = await pgHelper.getPendingStudyChange(id);
      if (pendingStudyChange.requested_for !== userName) {
        throw Boom.forbidden(
          'The requester is not allowed to update this pending study change'
        );
      } else {
        return await runTransaction(async (t) => {
          await pgHelper.updatePendingStudyChange(id, { transaction: t });
          await loggingserviceClient.createSystemLog({
            requestedBy: pendingStudyChange.requested_by,
            requestedFor: pendingStudyChange.requested_for,
            type: 'study_change',
          });
          return pendingStudyChange;
        }).catch((err) => {
          console.log(err);
          throw Boom.notFound(
            'The pending compliance change could not be updated: ' + err
          );
        });
      }
    } else {
      throw Boom.forbidden(
        'Could not update the pending compliance change: Unknown or wrong role'
      );
    }
  }

  async function deletePendingStudyChange(decodedToken, id, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Forscher':
        try {
          const pendingStudyChange = await pgHelper.getPendingStudyChange(id);
          if (
            pendingStudyChange.requested_for !== userName &&
            pendingStudyChange.requested_by !== userName
          ) {
            return Boom.forbidden(
              'The requester is not allowed to delete this pending study change'
            );
          } else {
            return await pgHelper.deletePendingStudyChange(id);
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending compliance change was not found');
        }

      default:
        return Boom.forbidden(
          'Could not delete the pending compliance change: Unknown or wrong role'
        );
    }
  }

  return {
    /**
     * @function
     * @description creates the pending study change in DB if it does not exist and the requester is allowed to
     * @memberof module:pendingStudyChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} data the study change object to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createPendingStudyChange: createPendingStudyChange,

    /**
     * @function
     * @description updates a pending study change in DB, confirms changes and changes all data
     * @memberof module:pendingStudyChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the pending study change to update
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updatePendingStudyChange: updatePendingStudyChange,

    /**
     * @function
     * @description deletes a pending study change and cancels the change request
     * @memberof module:pendingStudyChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the study to change vaiables for
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deletePendingStudyChange: deletePendingStudyChange,
  };
})();

module.exports = pendingStudyChangesInteractor;
