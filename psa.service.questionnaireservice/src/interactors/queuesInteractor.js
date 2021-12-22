/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pgHelper = require('../services/postgresqlHelper');

/**
 * @description interactor that handles answers requests based on users permissions
 */
const queuesInteractor = (function () {
  async function getAllQueues(decodedToken, username) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    if (userRole !== 'Proband') {
      throw new Error(
        'Could not get queues for proband: Unknown or wrong role'
      );
    }
    if (requester !== username) {
      throw new Error(
        'Could not get queues for proband, because user has no access'
      );
    }
    return await pgHelper.getAllQueuesForProband(username).catch((err) => {
      console.log(err);
      throw new Error('Could not get queues for proband: internal DB error');
    });
  }

  async function deleteOneQueue(decodedToken, username, instance_id) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    if (userRole !== 'Proband') {
      throw new Error(
        'Could not delete queue for proband: Unknown or wrong role'
      );
    }
    if (requester !== username) {
      throw new Error(
        'Could not delete queue for proband, because user has no access'
      );
    }
    return await pgHelper.deleteQueue(username, instance_id).catch((err) => {
      console.log(err);
      throw new Error('Could not delete queue for proband: internal DB error');
    });
  }

  return {
    /**
     * @function
     * @description gets all queues for a proband
     * @memberof module:queuesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} username the username of the proband to get queues for
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getAllQueues: getAllQueues,

    /**
     * @function
     * @description deletes a queue
     * @memberof module:queuesInteractor
     * @param {string} userToken the jwt of the request
     * @param {number} user_id the username of the proband to delete the queue for
     * @param {number} instance_id the instance id to delete the queue for
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deleteOneQueue: deleteOneQueue,
  };
})();

module.exports = queuesInteractor;
