/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const { config } = require('../config');
const sormasConfig = config.sormas;
const verbose = config.verbose;

const sormasClient = (function () {
  async function getLatestFollowUpEndDates(since) {
    let json;
    try {
      json = JSON.parse(
        await performFetch('get', '/visits-external/followUpEndDates/' + since)
      );
    } catch (e) {
      console.error(e);
      json = null;
    }
    if (!json || !Array.isArray(json)) {
      return new Error(
        'followUpEndDates: received empty or malformed response'
      );
    }
    if (verbose) {
      console.log('sormasClient: fetched end dates from SORMAS:');
      console.log(json);
    }
    return json;
  }

  async function uploadVisit(uuid, date, version, sormasData) {
    const fullSormasData = {
      personUuid: uuid,
      visitStatus: 'COOPERATIVE',
      visitDateTime: date,
      visitRemarks: `Version ${version}`,
      disease: 'CORONAVIRUS',
      symptoms: sormasData,
    };

    if (verbose) {
      console.log(fullSormasData);
    }

    let json;
    try {
      json = JSON.parse(
        await performFetch('post', '/visits-external/', [fullSormasData])
      );
    } catch (e) {
      json = [e];
    }
    if (json[0] !== 'OK') {
      console.error(json[0]);
      throw new Error('visits-upload: ' + json[0]);
    }
  }

  async function getApiVersion() {
    try {
      return await performFetch('get', '/visits-external/version');
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function setStatus(uuid, status) {
    let json;
    const fullSormasData = {
      status: status,
      statusDateTime: new Date(),
    };
    if (verbose) {
      console.log(fullSormasData);
    }
    try {
      json = JSON.parse(
        await performFetch(
          'post',
          '/visits-external/person/' + uuid + '/status',
          fullSormasData
        )
      );
    } catch (e) {
      json = e;
    }
    if (json !== true) {
      console.error(json);
      throw new Error('set-status: ' + json);
    }
    return json;
  }

  async function performFetch(method, path, body) {
    const url = sormasConfig.url + '/sormas-rest' + path;
    const headers = {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' +
        Buffer.from(
          sormasConfig.username + ':' + sormasConfig.password
        ).toString('base64'),
    };

    let res;
    switch (method) {
      case 'get':
      case 'delete':
        res = await fetch(url, { method, headers });
        break;
      case 'post':
      case 'put':
      case 'patch':
        res = await fetch(url, { method, body: JSON.stringify(body), headers });
        break;
    }
    if (!res) {
      throw new Error(
        `sormasClient: ${method} ${url} - did not receive a response`
      );
    }
    if (!res.ok) {
      console.error(await res.text());
      throw new Error(
        `sormasClient: ${method} ${url} - status code is ${res.status}`
      );
    }
    return await res.text();
  }

  return {
    /**
     * Returns a list of personUuid and latestFollowUpEndDate pairs for probands who
     * 1. have the symptom journal status set to ACCEPTED
     * 2. are related to a contact whose epidata was changed after {since}
     *
     * @param since {number} timestamp from which to fetch the end dates
     * @returns {Promise<{latestFollowUpEndDate: number, personUuid: string}[]>}
     */
    getLatestFollowUpEndDates: getLatestFollowUpEndDates,

    /**
     * Transfers mapped questionnaire answers to SORMAS
     * @param {string} uuid SORMAS person UUID
     * @param {date} date Timestamp of questionnaire instance
     * @param {number} version Version of answers
     * @param {Object} sormasData Key-Value pairs
     * @returns {Promise<void>}
     */
    uploadVisit: uploadVisit,

    /**
     * Returns version of the currently active SORMAS API
     *
     * @returns {Promise<string|null>}
     */
    getApiVersion: getApiVersion,

    /**
     * Transfers proband status to SORMAS
     * @param uuid
     * @param status
     * @returns {Promise<void>}
     */
    setStatus: setStatus,
  };
})();

module.exports = sormasClient;
