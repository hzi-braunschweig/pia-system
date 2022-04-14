/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const validator = require('email-validator');

const { MailService } = require('@pia/lib-service-core');
const { config } = require('../config');
const { loggingserviceClient } = require('../clients/loggingserviceClient');
const { runTransaction } = require('../db');
const pgHelper = require('../services/postgresqlHelper');
const { ProbandsRepository } = require('../repositories/probandsRepository');

/**
 * @description interactor that handles pending deletion requests based on users permissions
 */
const pendingComplianceChangesInteractor = (function () {
  async function getPendingComplianceChange(decodedToken, id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
        try {
          const pendingComplianceChange =
            await pgHelper.getPendingComplianceChange(id);
          if (
            pendingComplianceChange.requested_for !== userName &&
            pendingComplianceChange.requested_by !== userName
          ) {
            return Boom.forbidden(
              'The requester is not allowed to get this pending compliance change'
            );
          } else {
            return pendingComplianceChange;
          }
        } catch (err) {
          console.log(err);
          return Boom.notFound('The pending compliance change was not found');
        }

      default:
        return Boom.forbidden(
          'Could not get the pending compliance change: Unknown or wrong role'
        );
    }
  }

  async function getPendingComplianceChanges(decodedToken, studyName) {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden(
        'Could not get the pending compliance change: Unknown or wrong role'
      );
    }
    if (!userStudies.includes(studyName)) {
      throw Boom.forbidden('User has no access to this study');
    }
    return await pgHelper.getPendingComplianceChangesOfStudy(studyName);
  }

  async function createPendingComplianceChange(decodedToken, data) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const userStudies = decodedToken.groups;

    const createProbandComplianceChangeEmailContent = function (
      proband,
      confirmationURL
    ) {
      return {
        subject:
          'PIA - Sie wurden gebeten eine Einwilligungsänderung zu bestätigen',
        text:
          'Ein:e andere:r Probandenmanager:in möchte die Einwilligungen eines Teilnehmenden ändern und hat Sie als Änderungspartner:in ausgewählt.\n\n' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
          '\n\n' +
          confirmationURL +
          '\n\n' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:\n' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
          '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Änderungspartner:in telefonisch übergeben kann.\n' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.\n',
        html:
          'Ein:e andere:r Probandenmanager:in möchte die Einwilligungen eines Teilnehmenden ändern und hat Sie als Änderungspartner:in ausgewählt.<br><br>' +
          'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
          '<br><br><a href="' +
          confirmationURL +
          '">' +
          confirmationURL +
          '</a><br><br>' +
          'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
          'gehen Sie bitte wie folgt vor:<br>' +
          '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
          '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Änderungspartner:in telefonisch übergeben kann.<br>' +
          '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.<br>',
      };
    };

    const createProbandComplianceChangeConfirmationUrl = function (id) {
      return (
        config.webappUrl +
        `/probands-personal-info?pendingComplianceChangeId=${id}&type=compliance`
      );
    };

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden(
        'Could not create the pending deletion: Unknown or wrong role'
      );
    }
    /**
     * @type {ProfessionalUser}
     */
    const requestedFor = await pgHelper
      .getProfessionalUser(data.requested_for, userRole)
      .catch((err) => {
        throw Boom.boomify(err);
      });
    if (!requestedFor) {
      throw Boom.badData('The one who should confirm could not be found');
    }

    // Only gets the user if the requester is in same study, so these calls will check that
    let proband;
    try {
      proband = await ProbandsRepository.getProbandAsProfessional(
        data.proband_id,
        userStudies
      );
    } catch (err) {
      console.log(err);
      throw Boom.badData('The proband does not exist in any of your studies');
    }
    if (
      !requestedFor.study_accesses
        ?.map((access) => access.study_id)
        ?.includes(proband.study)
    ) {
      throw Boom.badData(
        'The proband does not exist in any of the studies of requested_for'
      );
    }

    const studyOfProband = await pgHelper
      .getStudy(proband.study)
      .catch((err) => {
        console.log(err);
        throw Boom.badData('Study not found');
      });

    if (
      studyOfProband.has_four_eyes_opposition &&
      studyOfProband.has_compliance_opposition
    ) {
      if (
        data.requested_for !== userName &&
        requestedFor &&
        requestedFor.role === 'ProbandenManager' &&
        validator.validate(data.requested_for)
      ) {
        data.requested_by = userName;

        const existingPendingComplianceChange =
          await pgHelper.getPendingComplianceChangeForProbandIdIfExisting(
            data.proband_id
          );

        if (proband && !existingPendingComplianceChange) {
          const pendingComplianceChange =
            await pgHelper.createPendingComplianceChange(data);
          const result = await MailService.sendMail(
            data.requested_for,
            createProbandComplianceChangeEmailContent(
              pendingComplianceChange.proband_id,
              createProbandComplianceChangeConfirmationUrl(
                pendingComplianceChange.id
              )
            )
          ).catch(async (err) => {
            await pgHelper.deletePendingComplianceChange(
              pendingComplianceChange.id
            );
            console.log(err);
            return Boom.badData('PM could not be reached via email: ' + err);
          });
          if (result) {
            return pendingComplianceChange;
          } else {
            return Boom.badData('PM could not be reached via email');
          }
        } else {
          return Boom.forbidden(
            'Proband not found or changes already requested'
          );
        }
      } else {
        return Boom.badData(
          'Some data was not fitting, is the PMs username an email address?'
        );
      }
    }
    // No 4-eye confirmation, change instantly
    else if (studyOfProband.has_compliance_opposition) {
      data.requested_by = userName;
      return await runTransaction(async (t) => {
        await pgHelper.updatePendingComplianceChange(
          -1,
          { transaction: t },
          data
        );
        await loggingserviceClient.createSystemLog({
          requestedBy: data.requested_by,
          requestedFor: data.requested_for,
          type: 'compliance',
        });
        return data;
      }).catch((err) => {
        console.log(err);
        throw Boom.boomify(err);
      });
    } else {
      return Boom.forbidden('This operation cannot be done for this study');
    }
  }

  async function updatePendingComplianceChange(decodedToken, id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'ProbandenManager') {
      return Boom.forbidden(
        'Could not update the pending compliance change: Unknown or wrong role'
      );
    }
    let pendingComplianceChange;
    try {
      pendingComplianceChange = await pgHelper.getPendingComplianceChange(id);
    } catch (err) {
      console.log(err);
      return Boom.notFound(
        'The pending compliance change could not be updated: ' + err
      );
    }
    if (pendingComplianceChange.requested_for !== userName) {
      throw Boom.forbidden(
        'The requester is not allowed to update this pending compliance change'
      );
    }
    return await runTransaction(async (t) => {
      await pgHelper.updatePendingComplianceChange(id, { transaction: t });
      await loggingserviceClient.createSystemLog({
        requestedBy: pendingComplianceChange.requested_by,
        requestedFor: pendingComplianceChange.requested_for,
        type: 'compliance',
      });
      return pendingComplianceChange;
    }).catch((err) => {
      console.log(err);
      return Boom.notFound(
        'The pending compliance change could not be updated: ' + err
      );
    });
  }

  async function deletePendingComplianceChange(decodedToken, id) {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'ProbandenManager':
        try {
          const pendingComplianceChange =
            await pgHelper.getPendingComplianceChange(id);
          const proband = await ProbandsRepository.getProband(
            pendingComplianceChange.proband_id
          );
          if (!proband || !userStudies.includes(proband.study)) {
            return Boom.forbidden(
              'The requester is not allowed to delete this pending compliance change'
            );
          } else {
            return await pgHelper.deletePendingComplianceChange(id);
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
     * @description gets a pending compliance change from DB if user is allowed to
     * @memberof module:pendingComplianceChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the pending compliance change to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPendingComplianceChange: getPendingComplianceChange,

    /**
     * @function
     * @description gets a pending compliance change for a proband from DB if user is allowed to
     * @memberof module:pendingComplianceChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the proband to get the pending compliance change to for
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPendingComplianceChanges: getPendingComplianceChanges,

    /**
     * @function
     * @description creates the pending compliance change in DB if it does not exist and the requester is allowed to
     * @memberof module:pendingComplianceChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} data the compliance change object to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createPendingComplianceChange: createPendingComplianceChange,

    /**
     * @function
     * @description updates a pending compliance change in DB, confirms changes and changes all data
     * @memberof module:pendingComplianceChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the pending compliance change to update
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updatePendingComplianceChange: updatePendingComplianceChange,

    /**
     * @function
     * @description deletes a pending compliance change and cancels the change request
     * @memberof module:pendingComplianceChangesInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the user to change compliances for
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deletePendingComplianceChange: deletePendingComplianceChange,
  };
})();

module.exports = pendingComplianceChangesInteractor;
