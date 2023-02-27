/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SharedArray } from 'k6/data';

export const users = new SharedArray('users', function () {
  let file = __ENV.USERS_FIXTURE;

  if (!file) {
    return [];
  }

  if (!file.startsWith('/')) {
    file = `../${__ENV.USERS_FIXTURE}`;
  }
  return JSON.parse(open(file));
});

export const professionals = new SharedArray('professionals', function () {
  let file = __ENV.PROFESSIONALS_FIXTURE;

  if (!file) {
    return [];
  }

  if (!file.startsWith('/')) {
    file = `../${__ENV.PROFESSIONALS_FIXTURE}`;
  }
  return JSON.parse(open(file));
});

export const researchers = new SharedArray('researchers', function () {
  return professionals.filter((pro) => pro.role === 'Forscher');
});

export function getUser(testIteration) {
  return users[testIteration % users.length];
}

export function getResearcher(testIteration) {
  return researchers[testIteration % researchers.length];
}
