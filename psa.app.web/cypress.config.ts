/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineConfig } from 'cypress';
import filesystemPlugin from './cypress/plugins/index';

export default defineConfig({
  defaultCommandTimeout: 20000,
  requestTimeout: 30000,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'tests/reports/xunit-e2e-report.xml',
    toConsole: true,
  },
  e2e: {
    setupNodeEvents(on, config) {
      return filesystemPlugin(on, config);
    },
    baseUrl: 'http://localhost',
  },
});
