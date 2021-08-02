/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';

export let options = {
  stages: [
    { duration: '2s', target: 1 },
    // { duration: '60s', target: 200 }, // simulate ramp-up of traffic from 1 to 100 users over 5 seconds.
    // { duration: '120s', target: 200 }, // stay at 100 users for 10 seconds
    // { duration: '30s', target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete below 1.5s
    'loaded webapp index.html': ['p(95)<1500'],
    'loaded webapp asset': ['p(95)<1500'],
    'logged in successfully': ['p(95)<1500'],
    'received studies list': ['p(95)<1500'],
    'received user settings': ['p(95)<1500'],
    'received compliance agreement': ['p(95)<1500'],
    'received compliance needed': ['p(95)<1500'],
    'received welcome text': ['p(95)<1500'],
    'received study active': ['p(95)<1500'],
    'received list of quesstionnaires': ['p(95)<1500'],
  },
};

const PROTOCOL = 'http://';
const HOST = 'localhost';
const BASE_URL = PROTOCOL + HOST;
const USERNAME = 'Dtest-9999999999';
const PASSWORD = '';

export default function main() {
  let apiGet;

  group('open webapp', function () {
    const response = getAsset('/', 'loaded webapp index.html');

    // load css and js assets based on index.html content
    const assetPaths = [
      response.html('link[rel="stylesheet"]').attr('href'),
      ...response.html('script[src]').map((idx, el) => el.attr('src')),
    ];
    assetPaths.forEach((path) => getAsset('/' + path));

    getAsset('/background_hor_transp.da2ab9d9f23015482989.jpg');
    getAsset('/assets/i18n/en-US.json');
    getAsset('/assets/i18n/de-DE.json');
    getAsset('/assets/images/logo-hzi.jpeg');
    getAsset('/favicon.png');
    getAsset('/de.7e82f4c71df5fc78abbb.svg');
    getAsset('/MaterialIcons-Regular.fa3334fe030aed8470dd.woff2');
  });

  group('login', function () {
    const response = http.post(
      BASE_URL + '/user/login',
      '{"username":"' +
        USERNAME +
        '","password":"' +
        PASSWORD +
        '","locale":"de-DE","logged_in_with":"web"}',
      {
        headers: {
          Host: HOST,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type':
            'application/json;type=content-type;mimeType=application/json',
          Origin: 'http://localhost',
          Connection: 'keep-alive',
        },
      }
    );

    check(response, {
      'logged in successfully': (res) =>
        res.status === 200 && res.json('token') !== '',
    });

    apiGet = createAuthorizedGet(response.json('token'));

    apiGet('/questionnaire/studies', 'received studies list');
    apiGet('/user/userSettings/' + USERNAME, 'received user settings');
    apiGet('/questionnaire/studies', 'received studies list');
    apiGet('/questionnaire/studies', 'received studies list');
    apiGet(
      '/compliance/Teststudie-%20Development/agree/' + USERNAME,
      'received compliance agreement'
    );
    apiGet(
      '/compliance/Teststudie-%20Development/agree/' + USERNAME + '/needed',
      'received compliance needed'
    );
    apiGet('/questionnaire/studies', 'received studies list');

    getAsset('/assets/images/download-play-store.png');
    getAsset('/assets/images/download-apple-store.png');

    apiGet(
      '/questionnaire/studies/Teststudie-%20Development/welcome-text',
      'received welcome text'
    );
    apiGet(
      '/compliance/Teststudie-%20Development/active',
      'received study active'
    );
  });

  group('show questionnaires', function () {
    apiGet('/questionnaire/studies', 'received studies list');

    apiGet(
      '/compliance/Teststudie-%20Development/agree/' + USERNAME + '/needed',
      'received compliance needed'
    );

    const response = apiGet('/questionnaire/questionnaireInstances');

    check(response, {
      'received list of quesstionnaires': (res) =>
        res.json('questionnaireInstances') &&
        res.json('questionnaireInstances').length >= 0,
    });
  });

  // Automatically added sleep
  sleep(1);
}

function getAsset(path, checkName = 'loaded webapp asset') {
  const response = http.get(BASE_URL + path, {
    headers: {
      Host: HOST,
      Accept: '*/*',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
    },
  });

  check(response, {
    [checkName]: (res) => res.status === 200,
  });

  return response;
}

function createAuthorizedGet(authToken) {
  return (path, checkName) => {
    const response = http.get(BASE_URL + path, {
      headers: {
        Host: HOST,
        Accept: '*/*',
        'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        Authorization: authToken,
        'Content-Type':
          'application/json;type=content-type;mimeType=application/json',
        Connection: 'keep-alive',
      },
    });

    if (checkName) {
      check(response, {
        [checkName]: (res) => res.status === 200 || res.status === 204,
      });
    }

    return response;
  };
}
