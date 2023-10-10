/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StatusCodes } from 'http-status-codes';
import { Server } from '../../src/server';

import { given } from './testBuilder';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('/', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('as Proband', () => {
    it(
      'GET / should work',
      given()
        .withTestUserProbandFromUserservice()
        .withProbandRole()
        .getPublicStatistics()
        .expectResponseStatus(StatusCodes.OK)
        .build()
    );
  });

  describe('as Forscher', () => {
    it(
      'GET / should work',
      given()
        .withForscherRole()
        .getAdminStatistics()
        .expectResponseStatus(StatusCodes.OK)
        .build()
    );

    it(
      'GET / should not work for studies that user has no access to',
      given()
        .withAllowedStudy('some-other-study')
        .withForscherRole()
        .getAdminStatistics()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );
  });
});
