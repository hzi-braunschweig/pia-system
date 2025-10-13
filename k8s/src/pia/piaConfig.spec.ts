/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fs from 'fs';
import { PiaConfig } from './piaConfig';

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

  it('should show missings for required configs', () => {
    expect(PiaConfig.getMissing(path)).toContain('webappUrl');
  });

  it('should not show missings for optional configs', () => {
    expect(PiaConfig.getMissing(path)).not.toContain('httpsProxyUrl');
  });
});
