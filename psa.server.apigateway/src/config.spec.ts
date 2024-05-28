/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import config from './config';
import { StatusCodes } from 'http-status-codes';

describe('Config', () => {
  it('isDevelopment should default to false', () => {
    expect(config.system.isDevelopment).to.be.false;
  });

  it('should not add route to deploymentservice by default', () => {
    const route = config.routes.find(
      (r) => r.upstream.host === 'deploymentservice'
    );
    expect(route).to.be.undefined;
  });

  it('should forbid service /metrics by default', () => {
    const route = config.responseRoutes
      .filter(
        (r) =>
          r.path.endsWith('/metrics') &&
          r.response.statusCode === StatusCodes.FORBIDDEN
      )
      .map((r) => r.path);
    expect(route).to.include('/api/v1/compliance/metrics');
    expect(route).to.include('/api/v1/user/metrics');

    expect(route).to.include('/admin/api/v1/compliance/metrics');
    expect(route).to.include('/admin/api/v1/user/metrics');
  });
});
