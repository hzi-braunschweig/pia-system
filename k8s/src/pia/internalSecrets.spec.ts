/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Testing } from 'cdk8s';
import { InternalSecrets } from './internalSecrets';
import * as fs from 'fs';

describe('InternalSecrets', () => {
  const path = 'pia-internal-secrets-test-dir';

  beforeAll(() => {
    fs.mkdirSync(path);
  });

  afterAll(() => {
    fs.rmdirSync(path);
  });

  it('can be generated', () => {
    InternalSecrets.createChart(Testing.app());
  });

  it('should show missings for an empty directory', () => {
    expect(InternalSecrets.getMissing(path).length).toBeGreaterThan(1);
  });
});
