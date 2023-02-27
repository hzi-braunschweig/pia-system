/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import http from 'k6/http';
import { scenario } from 'k6/execution';
import { check, group, sleep } from 'k6';
import { getResearcher, users } from '../util/load-users.js';

export let options = {
  vus: 1,
  iterations: 3,
  duration: '1m',
  setupTimeout: '1m',
  thresholds: {
    'http_req_duration{name:export}': ['avg<12000'],
    'http_req_duration{name:legacy_export}': ['avg<12000'],
  },
};

const BASE_URL = __ENV.URL;
const HOST = BASE_URL.split('://')[1];

export default () => {
  let apiGet;
  let apiPost;
  let user;
  let study;
  let questionnaires;
  let probands;

  group('login and initialize', function () {
    user = getResearcher(scenario.iterationInTest);
    study = user.studies[0].study_id;

    const res = http.post(
      `${BASE_URL}/api/v1/auth/realms/pia-admin-realm/protocol/openid-connect/token`,
      {
        client_id: `pia-admin-web-app-client`,
        grant_type: 'password',
        scope: 'openid',
        username: user.username,
        password: user.password,
      },
      { tags: { name: 'keycloak login', type: 'api' } }
    );

    check(res, {
      'keycloak:logged in successfully': (res) =>
        res.status === 200 && res.json('token') !== '',
    });

    apiGet = createAuthorizedGet(res.json('access_token'));
    apiPost = createAuthorizedPost(res.json('access_token'));

    probands = users.map((user) => user.username);

    const questionnairesResponse = apiGet(
      '/questionnaire/questionnaires',
      'Questionnaires'
    );
    questionnaires = questionnairesResponse.json('questionnaires');
  });

  group('legacy export', function () {
    if (questionnaires) {
      questionnaires = questionnaires.map((q) => ({
        id: q.id,
        version: q.version,
      }));

      const exportResponse = apiPost(
        '/questionnaire/export',
        'legacy_export',
        {
          start_date: null,
          end_date: null,
          study_name: user.studies[0].study_id,
          questionnaires,
          probands,
          exports: ['legacy_answers'],
        },
        'binary'
      );

      check(exportResponse, {
        [`api:legacy_export:zip`]: (res) =>
          res.headers['Content-Type'] === 'application/zip' &&
          res.body.byteLength > 0,
      });
    }
  });

  group('export', function () {
    if (questionnaires) {
      questionnaires = questionnaires.map((q) => ({
        id: q.id,
        version: q.version,
      }));

      const exportResponse = apiPost(
        '/questionnaire/export',
        'export',
        {
          start_date: null,
          end_date: null,
          study_name: user.studies[0].study_id,
          questionnaires,
          probands,
          exports: ['answers'],
        },
        'binary'
      );

      check(exportResponse, {
        [`api:export:zip`]: (res) =>
          res.headers['Content-Type'] === 'application/zip' &&
          res.body.byteLength > 0,
      });
    }
  });

  // Automatically added sleep
  sleep(5);
};

function createAuthorizedPost(accessToken) {
  return (path, name, body, responseType = 'text') => {
    const response = http.post(
      BASE_URL + '/admin/api/v1' + path,
      JSON.stringify(body),
      {
        headers: {
          Host: HOST,
          Accept: '*/*',
          'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate',
          Authorization: `Bearer ${accessToken}`,
          'Content-Type':
            'application/json;type=content-type;mimeType=application/json',
          Connection: 'keep-alive',
        },
        timeout: '30m',
        responseType,
        tags: {
          name,
          type: 'api',
        },
      }
    );

    if (name) {
      check(response, {
        [`api:${name}`]: (res) => res.status === 200 || res.status === 204,
      });
    }

    return response;
  };
}

function createAuthorizedGet(accessToken) {
  return (path, name) => {
    const response = http.get(BASE_URL + '/admin/api/v1' + path, {
      headers: {
        Host: HOST,
        Accept: '*/*',
        'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type':
          'application/json;type=content-type;mimeType=application/json',
        Connection: 'keep-alive',
      },
      tags: {
        name,
        type: 'api',
      },
    });

    if (name) {
      check(response, {
        [`api:${name}`]: (res) => res.status === 200 || res.status === 204,
      });
    }

    return response;
  };
}
