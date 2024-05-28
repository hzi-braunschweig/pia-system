/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import http from 'k6/http';
import { scenario } from 'k6/execution';
import { check, group, sleep } from 'k6';
import dev from '../stages/dev.js';
import peak from '../stages/peak.js';
import { getUser } from '../util/load-users.js';

// See the respective configuration file to learn more about their usage
const stagesConfiguration = { dev, peak };

export let options = {
  stages: __ENV.STAGES
    ? stagesConfiguration[__ENV.STAGES]
    : stagesConfiguration.dev,
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete below 1.5s
    'http_req_duration{group:::webapp before login}': ['p(95)<1500'],
    'http_req_duration{group:::keycloak login page}': ['p(95)<1500'],
    'http_req_duration{group:::login}': ['p(95)<1500'],
    'http_req_duration{group:::show questionnaires}': ['p(95)<1500'],
    'http_req_duration{type:asset}': ['p(95)<1500'],
    'http_req_duration{type:page}': ['p(95)<1500'],
    'http_req_duration{type:api}': ['p(95)<1500'],
    'http_req_duration{name:asset from index.html}': ['p(95)<1500'],
    'http_req_duration{name:asset from webapp}': ['p(95)<1500'],
    'http_req_duration{name:asset from css}': ['p(95)<1500'],
    'http_req_duration{name:keycloak}': ['p(95)<1500'],
    'http_req_duration{name:keycloak login}': ['p(95)<1500'],
    'http_req_duration{name:keycloak asset}': ['p(95)<1500'],
    'http_req_duration{name:received compliance agreement}': ['p(95)<1500'],
    'http_req_duration{name:received compliance needed}': ['p(95)<1500'],
    'http_req_duration{name:received welcome text}': ['p(95)<1500'],
    'http_req_duration{name:received study active}': ['p(95)<1500'],
    'http_req_duration{name:received list of questionnaires}': ['p(95)<1500'],
  },
};

const BASE_URL = __ENV.URL;
const HOST = BASE_URL.split('://')[1];

export default () => {
  let apiGet;
  let user;

  group('webapp before login', function () {
    const response = getPage('/', 'webapp index.html');

    // load css and js assets based on index.html content
    const assetPaths = [
      response.html('link[rel="stylesheet"]').attr('href'),
      ...response.html('script[src]').map((idx, el) => el.attr('src')),
    ];
    assetPaths.forEach((path) => getAsset('/' + path), 'asset from index.html');

    getAsset('/favicon.png', 'asset from index.html');

    getAsset('/assets/i18n/en-US.json', 'asset from webapp');
    getAsset('/assets/images/logo.jpeg', 'asset from webapp');

    // todo: make this request dynamic and independent from angular build
    getAsset(
      '/MaterialIcons-Regular.fa3334fe030aed8470dd.woff2',
      'asset from css'
    );

    // precursor requests for keycloak redirect
    getPage(
      '/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/3p-cookies/step1.html',
      'keycloak'
    );
    getPage(
      '/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/3p-cookies/step2.html',

      'keycloak'
    );
    getPage(
      '/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/login-status-iframe.html',
      'keycloak'
    );
  });

  group('keycloak login page', () => {
    getPage(
      `/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/auth?client_id=account-console&redirect_uri=https%3A%2F%2F${HOST}%2Fapi%2Fv1%2Fauth%2Frealms%2Fpia-proband-realm%2Faccount%2F%23%2F&state=30f1a91d-cfed-49b5-97d6-637c1905c004&response_mode=fragment&response_type=code&scope=openid&nonce=ced9bc0c-ea43-45e7-8f61-8840aa1cb537&code_challenge=NINIQ3CqgBKl-Q1t32PYA1opyhtbbg6pZRvwRD4zJDo&code_challenge_method=S256`,
      'keycloak'
    );
    getAsset(
      '/api/v1/auth/resources/iauof/login/pia/css/styles.css',
      'keycloak asset'
    );
    getAsset(
      '/api/v1/auth/resources/iauof/login/pia/img/pia_logo.png',
      'keycloak asset'
    );
    getAsset(
      '/api/v1/auth/resources/iauof/login/pia/img/favicon.png',
      'keycloak asset'
    );
  });

  group('login', function () {
    user = getUser(scenario.iterationInTest);

    const res = http.post(
      `${BASE_URL}/api/v1/auth/realms/pia-proband-realm/protocol/openid-connect/token`,
      {
        client_id: `pia-proband-web-app-client`,
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

    apiGet(
      '/compliance/' + user.study + '/agree/' + user.username,
      'received compliance agreement'
    );
    apiGet(
      '/compliance/' + user.study + '/agree/' + user.username + '/needed',
      'received compliance needed'
    );

    getPage('/home', 'startpage');
    getAsset('/assets/images/download-play-store.png');
    getAsset('/assets/images/download-apple-store.png');

    apiGet(
      '/questionnaire/studies/' + user.study + '/welcome-text',
      'received welcome text'
    );
    apiGet('/compliance/' + user.study + '/active', 'received study active');
  });

  group('show questionnaires', function () {
    apiGet(
      '/compliance/' + user.study + '/agree/' + user.username + '/needed',
      'received compliance needed'
    );

    const response = apiGet(
      '/questionnaire/questionnaireInstances?status=active&status=in_progress',
      'received list of questionnaires'
    );

    check(response, {
      'api:received list of questionnaires had content': (res) =>
        res.json('questionnaireInstances') &&
        res.json('questionnaireInstances').length >= 0,
    });
  });

  // Automatically added sleep
  sleep(1);
};

function getPage(path, name) {
  return httpGet(path, { name, type: 'page' });
}

function getAsset(path, name = 'asset') {
  return httpGet(path, { name, type: 'asset' });
}

function httpGet(path, tags) {
  const response = http.get(BASE_URL + path, {
    headers: {
      Host: HOST,
      Accept: '*/*',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate',
      Connection: 'keep-alive',
    },
    tags,
  });

  check(response, {
    [`${tags.type}:${tags.name}`]: (res) => res.status === 200,
  });

  return response;
}

function createAuthorizedGet(accessToken) {
  return (path, name) => {
    const response = http.get(BASE_URL + '/api/v1' + path, {
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
