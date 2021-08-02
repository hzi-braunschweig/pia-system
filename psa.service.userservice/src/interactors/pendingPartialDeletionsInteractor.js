/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const validator = require('email-validator');

const { runTransaction } = require('../db');
const loggingserviceClient = require('../clients/loggingserviceClient');
const pendingPartialDeletionRepository = require('../repositories/pendingPartialDeletionRepository');
const pgHelper = require('../services/postgresqlHelper');
const mailService = require('../services/mailService.js');
const { config } = require('../config');
const pendingPartialDeletionMapper = require('../services/pendingPartialDeletionMapper');

/**
 * Interactor that handles pending deletion requests based on users permissions
 */
class PendingPartialDeletionsInteractor {
  /**
   * gets a pending partial deletion from DB if user is allowed to
   * @param {object} decodedToken the decoded jwt of the request
   * @param {number} id the id of the pending deletion to get
   * @returns {Promise<PendingPartialDeletionRes>} promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async getPendingPartialDeletion(decodedToken, id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'Forscher') {
      return Boom.forbidden(
        'Could not get the pending partial deletion: Unknown or wrong role'
      );
    }
    const pendingPartialDeletion = await pendingPartialDeletionRepository
      .getPendingPartialDeletion(id)
      .catch((err) => {
        console.log(err);
        throw Boom.notFound('The pending deletion was not found');
      });
    if (
      pendingPartialDeletion.requested_for !== userName &&
      pendingPartialDeletion.requested_by !== userName
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to get this pending deletion'
      );
    }
    return pendingPartialDeletionMapper.mapDbPendingPartialDeletion(
      pendingPartialDeletion
    );
  }

  /**
   * Sends a request email to the one, who should confirm this partial deletion
   * @param {string} mailAddress
   * @param {number} id ID of the partial Deletion
   * @return {Promise<any>}
   * @private
   */
  static _sendPartialDeletionEmail(mailAddress, id) {
    const confirmationURL =
      config.webappUrl + `/probands?pendingPartialDeletionId=${id}`;
    const content = {
      subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
      text:
        'Ein:e andere:r Forscher:in möchte den teilweisen Widerspruch eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '\n\n' +
        confirmationURL +
        '\n\n',
      html:
        'Ein:e andere:r Forscher:in möchte den teilweisen Widerspruch eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>',
    };
    return mailService.sendMail(mailAddress, content).catch((err) => {
      console.error(err);
      throw Boom.badData('Forscher could not be reached via email.');
    });
  }

  /**
   * creates the pending partial deletion in DB if it does not exist and the requester is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param {PendingPartialDeletionReq} data the pending partial deletions object to create
   * @return {Promise<PendingPartialDeletionRes>}
   */
  static async createPendingPartialDeletion(decodedToken, data) {
    const userRole = decodedToken.role;
    const requestedBy = decodedToken.username;

    if (userRole !== 'Forscher') {
      return Boom.forbidden(
        'Could not create the pending partial deletion: Unknown or wrong role'
      );
    }
    return await runTransaction(async (transaction) => {
      if (data.requestedFor === requestedBy) {
        throw Boom.badData(
          'The requester and the one who should confirm cannot be the same user'
        );
      }
      if (!validator.validate(data.requestedFor)) {
        throw Boom.badData(
          'The username of the one who should confirm is not an email'
        );
      }
      const requestedFor = await pgHelper.getUser(data.requestedFor);
      if (!requestedFor) {
        throw Boom.badData('The one who should confirm could not be found');
      }
      if (requestedFor.role !== 'Forscher') {
        throw Boom.badData('The one who should confirm is not a researcher');
      }
      const studiesInCommon = await pgHelper.getCommonStudiesOfAllUsers(
        [requestedBy, data.requestedFor, data.probandId],
        { transaction }
      );
      if (studiesInCommon.length === 0) {
        throw Boom.forbidden(
          'Proband, requester and the one who should confirm are not in the same study.'
        );
      }
      if (
        !(await pgHelper.areInstanceIdsFromUser(
          data.probandId,
          data.forInstanceIds,
          {
            transaction,
          }
        )) ||
        !(await pgHelper.areSampleIdsFromUser(
          data.probandId,
          data.forLabResultsIds,
          {
            transaction,
          }
        ))
      ) {
        throw Boom.forbidden('Not all data belong to the submitted proband.');
      }

      const pendingPartialDeletion =
        await pendingPartialDeletionRepository.createPendingPartialDeletion(
          pendingPartialDeletionMapper.mapReqPendingPartialDeletion(
            requestedBy,
            data
          ),
          { transaction }
        );
      const result = await this._sendPartialDeletionEmail(
        data.requestedFor,
        pendingPartialDeletion.id
      );
      if (!result) {
        throw Boom.badData('Forscher could not be reached via email.');
      }
      return pendingPartialDeletionMapper.mapDbPendingPartialDeletion(
        pendingPartialDeletion
      );
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err);
    });
  }

  /**
   * updates a pending partial deletion in DB, confirms deletion and delets all data
   * @param {object} decodedToken the decoded jwt of the request
   * @param {number} id the id of the pending deletion to update
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async updatePendingPartialDeletion(decodedToken, id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'Forscher') {
      return Boom.forbidden(
        'Could not update the pending partial deletion: Unknown or wrong role'
      );
    }
    return await runTransaction(async (transaction) => {
      const pendingPartialDeletion = await pendingPartialDeletionRepository
        .getPendingPartialDeletion(id, { transaction })
        .catch((err) => {
          console.log(err);
          throw Boom.notFound(err);
        });
      if (pendingPartialDeletion.requested_for !== userName) {
        throw Boom.forbidden(
          'The requester is not allowed to update this pending deletion'
        );
      }
      const executedPendingPartialDeletion =
        await pendingPartialDeletionRepository.executePendingPartialDeletion(
          id,
          { transaction }
        );
      if (executedPendingPartialDeletion.delete_logs) {
        await loggingserviceClient.deleteLogs(
          executedPendingPartialDeletion.proband_id,
          {
            fromTime: executedPendingPartialDeletion.from_date,
            toTime: executedPendingPartialDeletion.to_date,
          }
        );
      }
      await loggingserviceClient.createSystemLog({
        requestedBy: executedPendingPartialDeletion.requested_by,
        requestedFor: executedPendingPartialDeletion.requested_for,
        type: 'partial',
      });
      return pendingPartialDeletionMapper.mapDbPendingPartialDeletion(
        executedPendingPartialDeletion
      );
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err);
    });
  }

  /**
   * deletes a pending partial deletion and cancels the deletion request
   * @param {object} decodedToken the decoded jwt of the request
   * @param {number} id the id of the user to delete
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async deletePendingPartialDeletion(decodedToken, id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'Forscher') {
      return Boom.forbidden(
        'Could not update the pending partial deletion: Unknown or wrong role'
      );
    }
    return await runTransaction(async (transaction) => {
      const pendingPartialDeletion = await pendingPartialDeletionRepository
        .getPendingPartialDeletion(id, { transaction })
        .catch((err) => {
          console.log(err);
          return Boom.notFound('The pending partial deletion was not found');
        });
      if (
        pendingPartialDeletion.requested_for !== userName &&
        pendingPartialDeletion.requested_by !== userName
      ) {
        throw Boom.forbidden(
          'The requester is not allowed to delete this pending deletion'
        );
      }
      return await pendingPartialDeletionRepository.deletePendingPartialDeletion(
        id,
        { transaction }
      );
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err);
    });
  }
}

module.exports = PendingPartialDeletionsInteractor;
