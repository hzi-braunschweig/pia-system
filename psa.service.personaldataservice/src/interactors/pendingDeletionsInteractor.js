/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const pendingDeletionRepository = require('../repositories/pendingDeletionRepository');
const {
  PendingDeletionService,
} = require('../services/pendingDeletionService');
const { userserviceClient } = require('../clients/userserviceClient');

class PendingDeletionsInteractor {
  /**
   * Gets a pending deletion from DB if user is allowed to
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {string} studyName the id of the pending deletion to get
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async getPendingDeletions(decodedToken, studyName) {
    const userRole = decodedToken.role;
    const studies = decodedToken.groups;

    if (!studies.includes(studyName)) {
      throw Boom.forbidden('no access to the study');
    }
    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    return await pendingDeletionRepository.getPendingDeletionsOfStudy(
      studyName
    );
  }

  /**
   * Gets a pending deletion from DB if user is allowed to
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {string} proband_id the id of the pending deletion to get
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async getPendingDeletion(decodedToken, proband_id) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const studies = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    const pendingDeletion = await pendingDeletionRepository
      .getPendingDeletion(proband_id)
      .catch((err) => {
        console.error(err);
        throw Boom.notFound('The pending deletion was not found');
      });
    if (
      (pendingDeletion.requested_for !== userName &&
        pendingDeletion.requested_by !== userName) ||
      !studies.includes(pendingDeletion.study)
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to get this pending deletion'
      );
    }
    return pendingDeletion;
  }

  /**
   * Creates the pending deletion in DB if it does not exist and the requester is allowed to
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {PendingDeletionReq} deletion the deletion object to create
   * @returns {Promise<PendingDeletionRes>} the new created pending deletion
   */
  static async createPendingDeletion(decodedToken, deletion) {
    const userRole = decodedToken.role;
    deletion.requested_by = decodedToken.username;
    const studyAccesses = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    const affectedStudy = await userserviceClient
      .getStudyOfProband(deletion.proband_id)
      .then(async (studyName) => userserviceClient.getStudy(studyName));

    const probandsOfRequestedFor =
      await userserviceClient.getProbandsWithAccessToFromProfessional(
        deletion.requested_for
      );
    if (
      !studyAccesses.includes(affectedStudy.name) ||
      !probandsOfRequestedFor.includes(deletion.proband_id)
    ) {
      throw Boom.notFound(
        'Proband, requested_by and requested_for are not in the same study.'
      );
    }

    if (
      !(
        affectedStudy.has_total_opposition ||
        affectedStudy.has_partial_opposition
      )
    ) {
      throw Boom.forbidden('This operation is not allowed for this study');
    }

    if (affectedStudy.has_four_eyes_opposition) {
      if (deletion.requested_for === deletion.requested_by) {
        throw Boom.badData(
          'You cannot request a deletion to be confirmed by yourself.'
        );
      }
      return PendingDeletionService.createPendingDeletion(deletion);
    } else {
      if (deletion.requested_for !== deletion.requested_by) {
        throw Boom.badData(
          'You cannot delete and say it was confirmed by someone else.'
        );
      }
      await PendingDeletionService.executeDeletion(deletion);
      return deletion;
    }
  }

  /**
   * Confirms a pending deletion and deletes all data
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {string} probandId the id of the pending deletion to update
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async executePendingDeletion(decodedToken, probandId) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const studies = decodedToken.groups;

    // checking if requester is allowed to execute deletion
    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    const pendingDeletion = await pendingDeletionRepository
      .getPendingDeletion(probandId)
      .catch((err) => {
        console.error(err);
        throw Boom.notFound('The pending deletion was not found');
      });
    if (
      pendingDeletion.requested_for !== userName ||
      !studies.includes(pendingDeletion.study)
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to execute this pending deletion'
      );
    }

    // execute deletion
    await PendingDeletionService.executeDeletion(pendingDeletion);
    return pendingDeletion;
  }

  /**
   * Deletes a pending deletion and cancels the deletion request
   * @param {AccessToken} decodedToken the jwt of the request
   * @param {string} probandId the id of the user to delete
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  static async deletePendingDeletion(decodedToken, probandId) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const studies = decodedToken.groups;

    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('Wrong role for this command');
    }
    const pendingDeletion = await pendingDeletionRepository
      .getPendingDeletion(probandId)
      .catch((err) => {
        console.error(err);
        throw Boom.notFound('The pending deletion was not found');
      });
    if (
      (pendingDeletion.requested_for !== userName &&
        pendingDeletion.requested_by !== userName) ||
      !studies.includes(pendingDeletion.study)
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to delete this pending deletion'
      );
    }
    await PendingDeletionService.deletePendingDeletion(probandId);
  }
}

module.exports = PendingDeletionsInteractor;
