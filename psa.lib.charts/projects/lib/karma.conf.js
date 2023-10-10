/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require('path');
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-junit-reporter'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
        jasmine: {
          timeoutInterval: 40000,
        },
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      './src/**/*.ts': ['coverage'],
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: path.join(__dirname, '../../coverage'),
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'cobertura', dir: '../../coverage/', subdir: '.' },
        { type: 'lcovonly', dir: '../../coverage/', subdir: '.' },
        { type: 'json', dir: '../../coverage/', subdir: '.' },
      ],
    },
    reporters: ['progress', 'coverage', 'kjhtml', 'junit'],
    junitReporter: {
      outputDir: './tests/reports',
      outputFile: 'xunit-test-report.xml',
      useBrowserName: false,
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};
