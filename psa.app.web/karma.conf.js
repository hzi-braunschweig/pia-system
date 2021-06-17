// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require('path');
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular', 'pact'],
    plugins: [
      require('karma-jasmine'),
      require('karma-junit-reporter'),
      require('@pact-foundation/karma-pact'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        timeoutInterval: 40000,
      },
    },
    coverageIstanbulReporter: {
      dir: path.join(__dirname, './coverage'),
      reports: ['html', 'text-summary', 'cobertura', 'lcovonly', 'json'],
      fixWebpackSourcePaths: true,
    },
    reporters: ['progress', 'kjhtml', 'junit'],
    junitReporter: {
      outputDir: './tests/reports', // results will be saved as $outputDir/$browserName.xml
      outputFile: 'xunit-test-report.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
      useBrowserName: false, // add browser name to report and classes names
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
    pact: [
      {
        consumer: 'WebApp',
        provider: 'ComplianceService',
        port: 14010,
        cors: true,
        spec: 3,
        log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
        dir: path.resolve(process.cwd(), 'pacts'),
      },
    ],
    proxies: {
      '/api/v1/compliance': 'http://localhost:14010/api/v1/compliance',
    },
  });
};
