/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PiaConfig } from './piaConfig';
import * as fs from 'fs';

describe('PiaConfig', () => {
  const path = 'pia-config-test-dir';

  beforeAll(() => {
    fs.mkdirSync(path);
  });

  afterAll(() => {
    fs.rmdirSync(path);
  });

  it('should show missings for an empty directory', () => {
    expect(PiaConfig.getMissing(path).length).toBeGreaterThan(1);
  });
});
